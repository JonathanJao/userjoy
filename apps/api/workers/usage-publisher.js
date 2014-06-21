/**
 * npm dependencies
 */

var _ = require('lodash');
var async = require('async');
var cronJob = require('cron')
  .CronJob;
var moment = require('moment');


/**
 * usage queue
 */

var q = require('./queues')
  .usage;


/**
 * Helpers
 */

var logger = require('../helpers/logger');


/**
 * Models
 */

var App = require('../api/models/App');


/**
 * Hourly Cron Job
 */

var HOURLY_SCHEDULE = '0 * * * *';


/**
 * Per Minute Cron
 */

var MINUTE_SCHEDULE = '*/1 * * * *';


/**
 * Daily cron
 */

var DAILY_SCHEDULE =  '0 0 * * *';


// TODO: THIS CODE NEEDS TO BE MANAGED IN INSIDE THE APPS CONFIG FILE
var SCHEDULE = MINUTE_SCHEDULE;
if (process.env.NODE_ENV === 'production') {
  SCHEDULE = DAILY_SCHEDULE;
}


/**
 * Find all active apps
 *
 * @param {function} cb callback
 */

function findActiveApps(cb) {

  App
    .find({
      isActive: true
    })
    .select({
      _id: 1
    })
    .exec(cb);

}


/**
 * Cron function to find all apps and put them into queue
 *
 * @param {function} cb optional callback function (used for testing)
 */

function cronFunc(cb) {

  logger.trace('workers/usagePublisher cronFunc');

  async.waterfall([

      function find(cb) {
        findActiveApps(cb);
      },

      function queue(apps, cb) {

        var ids = _.chain(apps)
          .pluck('_id')
          .map(function (id) {
            return id.toString();
          })
          .value();

        q.post(ids, function (err, queueIds) {
          cb(err, queueIds, ids);
        });
      }

    ],

    function finalCallback(err, queueIds, ids, numberAffected) {

      logger.trace('workers/usagePublisher Completed');

      if (err) {
        logger.crit({
          at: 'workers/usage-publisher',
          err: err,
          ts: Date.now()
        });
      }

      if (cb) {
        return cb(err, queueIds, ids, numberAffected);
      }

    });
}


/**
 * Expose cron job with daily/minutely schedule
 */

module.exports = function () {
  return new cronJob(SCHEDULE, cronFunc, null, true, "");
};


/**
 * Expose functions for the test cases
 */

module.exports._cronFunc = cronFunc;
module.exports._findActiveApps = findActiveApps;
