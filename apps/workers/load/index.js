/**
 * npm dependencies
 */

var _ = require('lodash');
var async = require('async');
var express = require('express');
var path = require('path');


var db = require('./db');


/**
 * directory path var
 */

var workersDir = '../../api/workers/';


/**
 * Jobs
 */

var automessagePublisher = require(path.join(workersDir,
  '/automessage-publisher'));

var automessageConsumer = require(path.join(workersDir,
  '/automessage-consumer'));


/**
 * Helpers
 */

var logger = require('../helpers/logger');


/**
 * If NODE_ENV has not already been defined,
 * then set default environment as 'development'
 */

function setEnv() {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }
}

/**
 * Start app server
 */

exports.start = function startServer(done) {

  var app = express();

  app.set('port', process.env.PORT || 8003);
  setEnv();


  /**
   * run newrelic agent (unless in test environment)
   */

  if (process.env.NODE_ENV !== 'test') {
    require('newrelic');
  }


  async.waterfall(

    [

      function connectDB(cb) {

        db.connect(function (err, db) {
          cb(err, db);
        });

      },

      function startServer(db, cb) {

        var server = app.listen(app.get('port'), function () {
          cb(null, db, server);
        });

      },

      function startCronJobs(db, server, cb) {

        automessagePublisher();
        automessageConsumer();

        cb(null, db, server);
      }

    ],

    function callback(err, db, server) {

      if (err) {

        logger.crit({
          at: 'workers load/index',
          err: err
        });

        return (done && done(err));
      };

      printMessage(db, app);
      done && done(null, db, app);

    });


}


/**
 * Stop app server
 */

// exports.stop = function stopServer(done) {

//   console.log('-------------------------------------------------');
//   console.log('   Shutting down server');
//   console.log('-------------------------------------------------');

//   process.exit(0);

// }


function printMessage(db, app) {

  console.log();
  console.log('-------------------------------------------------');
  console.log('   Express server listening');
  console.log();
  console.log('   Port              :     ', app.get('port'));
  console.log('   Environment       :     ', process.env.NODE_ENV);
  console.log('   Database          :     ', db.name);
  console.log('-------------------------------------------------');
  console.log();
  console.log();
  console.log();

}
