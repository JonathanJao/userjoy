/**
 * npm dependencies
 */

var _ = require('lodash');
var async = require('async');
var cronJob = require('cron')
  .CronJob;
var iron_mq = require('iron_mq');
var moment = require('moment');


/**
 * Helpers
 */

var logger = require('../helpers/logger');


/**
 * Models
 */

var AutoMessage = require('../api/models/AutoMessage');


/**
 * Config settings
 *
 * TODO: move these to central config settings file
 */

var TOKEN = 'Rfh192ozhicrSZ2R9bDX8uRvOu0';
var PROJECT_ID_DEV = '536e5455bba6150009000090';


/**
 * Hourly Cron Job
 */

var HOURLY_SCHEDULE = '0 * * * *';


/**
 * Per Minute Cron
 */

var MINUTE_SCHEDULE = '*/1 * * * *';


// TODO: THIS CODE NEEDS TO BE MANAGED IN INSIDE THE APPS CONFIG FILE
var SCHEDULE = MINUTE_SCHEDULE;
if (process.env.NODE_ENV === 'production') {
  SCHEDULE = HOURLY_SCHEDULE;
}


/**
 * Create iron mq client instance
 */

var imq = new iron_mq.Client({
  token: TOKEN,
  project_id: PROJECT_ID_DEV,
  queue_name: 'automessage'
});


/**
 * use 'automessge' queue on iron mq
 */

var q = imq.queue("automessage");


/**
 * Find all automessages that are active and were last run at least 6 hours ago
 *
 * @param {function} cb callback
 */

function findAutoMessages(cb) {
  logger.trace('workers/automessagePublisher findAutoMessages');


  // TODO: check if this is working
  var sixHoursAgo = moment()
    .subtract('hours', 6)
    .unix();

  logger.trace(sixHoursAgo);

  AutoMessage
    .find({
      active: true,
      lastQueued: {
        $lt: sixHoursAgo
      }
    })
    .select({
      _id: 1
    })
    .exec(cb);

}


/**
 * updates the 'lastQueued' timestamp for all given automessages
 *
 * @param {array} ids automessage ids
 * @param {function} cb callback
 */

function updateLastQueued(ids, cb) {

  var query = {
    _id: {
      $in: ids
    }
  };

  var update = {
    $set: {
      lastQueued: Date.now()
    }
  };

  var options = {
    multi: true
  };


  AutoMessage
    .update(query, update, options, function (err, numberAffected) {
      cb(err, numberAffected);
    });
}


/**
 * Cron function to find all valid automessages and put them into queue
 *
 * @param {function} cb optional callback function (used for testing)
 */

function cronFunc(cb) {

  logger.trace('workers/automessagePublisher cronFunc');

  async.waterfall([

      function find(cb) {
        findAutoMessages(cb);
      },

      function queue(msgs, cb) {

        var ids = _.chain(msgs)
          .pluck('_id')
          .map(function (id) {
            return id.toString();
          })
          .value();

        q.post(ids, function (err, queueIds) {
          cb(err, queueIds, ids);
        });
      },

      function updateTime(queueIds, ids) {
        updateLastQueued(ids, function (err, numberAffected) {
          cb(err, queueIds, ids, numberAffected);
        });
      }


    ],

    function finalCallback(err, queueIds, ids, numberAffected) {

      logger.trace('workers/automessagePublisher Completed');

      if (err) {
        logger.crit({
          at: 'jobs/automessage',
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
 * Expose cron job with hourly/minutely schedule
 */

module.exports = function () {
  return new cronJob(SCHEDULE, cronFunc, null, true, "");
};


/**
 * Expose functions for the test cases
 */

module.exports._cronFunc = cronFunc;
module.exports._findAutoMessages = findAutoMessages;
module.exports._updateLastQueued = updateLastQueued;
