/**
 * NPM dependencies
 */

var _ = require('lodash');
var async = require('async');
var chai = require('chai');
var mongoose = require('mongoose');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.use(sinonChai);
var expect = chai.expect;


/**
 * Load application
 */

var loadApp = require('../load');


/**
 * DB Fixtures
 */

var loadFixtures = require('./fixtures');


/**
 * Test url for superagent to work on
 */

var TEST_URL = 'http://localhost:8002';


/**
 * Clear the test database
 */

function clearDb(callback) {


  function getMongoPath() {
    var path = mongoose.connections[0].host +
      ':' +
      mongoose.connections[0].port +
      '/' +
      mongoose.connections[0].name;

    return path;
  }


  mongoose.connection.db
    .executeDbCommand({
        dropDatabase: 1
      },

      function (err, result) {

        var mongoPath = getMongoPath();

        //Kill the current connection, then re-establish it
        mongoose.connection.close()

        mongoose.connect('mongodb://' + mongoPath, function (err) {

          var asyncFunctions = [];

          // Loop through all the known schemas, and
          // execute an ensureIndex to make sure we're clean
          _.each(

            mongoose.connections[0].base.modelSchemas,

            function (schema, key) {

              asyncFunctions.push(function (cb) {
                mongoose
                  .model(key, schema)
                  .ensureIndexes(cb);
              })
            });

          async.parallel(asyncFunctions, function (err) {
            console.log('  Cleared DB\n');
            callback(err);
          })

        })
      })

}


/**
 * Generates a Login user helper
 */

function loginUserGenerator(email, password) {

  return function loginUser(done) {

    request
      .post('/auth/login')
      .send({
        email: email,
        password: password
      })
      .expect({
        message: 'Logged In Successfully'
      })
      .expect(200)
      .end(function (err, res) {
        global.loginCookie = res.header['set-cookie'];
        // console.log('loginUser', res.header['set-cookie']);
        done(err);
      });
  };

}


/**
 * Log out user helper
 */

function logoutUser(done) {
  request
    .post('/auth/logout')
    .expect({
      message: 'Logged Out Successfully'
    })
    .expect(200)
    .end(function (err, res) {
      global.loginCookie = '';
      done(err);
    });
}


/**
 * Add commonly used modules to Globals
 */

function defineGlobals() {
  global.request = require('supertest')
    .agent(TEST_URL);
  global._ = _;
  global.async = async;
  global.logoutUser = logoutUser;
  global.loginCookie = '';
  global.setupTestDb = setupTestDb;
  global.expect = expect;
  global.sinon = sinon;
}


/**
 * Start api server
 */

function startServer(done) {
  loadApp.start(done);
}


/**
 * Set node environment to test
 */

function setTestEnv() {
  process.env.NODE_ENV = 'test';
}


function setupTestDb(done) {

  var fixtureData;

  async.series({

    clearDb: function (cb) {
      clearDb(cb);
    },

    loadFixtures: function (cb) {
      loadFixtures(function (err, savedData) {
        if (err) return cb(err);
        fixtureData = savedData;
        global.saved = savedData;
        cb();
      });
    },

    loginFunction: function (cb) {

      var firstAccount = fixtureData.accounts.first;

      // add loginUser helper to global
      global.loginUser = loginUserGenerator(firstAccount.email,
        firstAccount.password);
      cb();
    },

    logoutUser: function (cb) {
      logoutUser(cb);
    }

  }, done)

}


/**
 * Define the global before hook
 * for the mocha tests
 */

before(function (done) {

  async.series({

    setTestEnv: function (cb) {
      setTestEnv();
      cb();
    },

    startServer: function (cb) {
      startServer(cb);
    },

    setGlobals: function (cb) {
      defineGlobals();
      cb();
    },

    clearDb: function (cb) {
      clearDb(cb);
    }

  }, done)

});


/**
 * Define the global after hook
 * for the mocha tests
 */

after(function (done) {

  clearDb(function (err) {
    if (err) return done(err);
    mongoose.disconnect(done);
  });

});
