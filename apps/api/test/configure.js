var loadApp = require('../load'),
  mongoose = require('mongoose'),
  async = require('async'),
  _ = require('lodash'),

  TEST_URL = 'http://localhost:3000';


/**
 * Drop the test database
 */

function dropTestDb(cb) {
  mongoose.connection.db.dropDatabase(function () {

    console.log();
    console.log('  Dropped DB');
    console.log();
    console.log();

    cb();
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
  global.dropTestDb = dropTestDb;
  global.loginUser = loginUser;
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


/**
 * Login user helper
 */

var loginUser = function loginUser(opts) {
  return function (done) {
    request
      .post('/login')
      .send(opts)
      .expect(200)
      .end(done);

  };
};


/**
 * Define the global before hook
 * for the mocha tests
 */

before(function (done) {

  setTestEnv();

  startServer(function (err, db) {

    if (err) {
      return done(err);
    }

    defineGlobals();

    dropTestDb(done);

  });

});


/**
 * Define the global after hook
 * for the mocha tests
 */

after(function (done) {

  dropTestDb(done);

});
