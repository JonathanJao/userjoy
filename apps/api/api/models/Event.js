/**
 * Model for events belonging to an app
 */


/**
 * NPM dependencies
 */

var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var troop = require('mongoose-troop');
var eventTypeValidator = require('../../helpers/event-type-validator');


var Schema = mongoose.Schema;


/**
 * helpers
 */

var metadata = require('../../helpers/metadata');


/**
 * Define property schema (embedded document)
 */

var MetaDataSchema = new Schema({

    // key
    k: {
      type: Schema.Types.Mixed,
      required: true
    },

    // value
    v: {
      type: Schema.Types.Mixed,
      required: true
    }

  },

  {
    _id: false
  });



/**
 * Define event schema
 */

var EventSchema = new Schema({


  // app Id
  aid: {
    type: Schema.Types.ObjectId,
    ref: 'App',
    required: [true, 'Invalid aid']
  },


  // automessage Id
  // this should not be part of the meta array because this is a db id
  amId: {
    type: Schema.Types.ObjectId,
    ref: 'AutoMessage'
  },


  // automessage status update
  // if automessage event then store the automessage state here
  amState: {
    type: String
  },


  // company Id
  cid: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },


  // created at
  ct: {
    type: Date,
    default: Date.now
  },


  // name of the module
  module: String,


  // metadata about the event
  meta: [MetaDataSchema],


  // name of the event
  // NOTE: in case of pageview type, this stores the path
  name: {
    type: String,
    required: [true, 'Invalid event name']
  },


  // type of the event
  type: {
    type: String,
    required: [true, 'Event type is required'],
    validate: eventTypeValidator
  },

  // user Id
  uid: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Invalid uid']
  }

});


/**
 * Add indexes
 */

EventSchema.index({
  aid: 1,
  cid: 1,
  type: 1,
  uid: 1,
  ct: 1
});


/**
 * Create a new track/form/link event
 *
 * @param {string} type form/link/track
 * @param {object} ids (should contain aid, uid, cid)
 * @param {string} action
 * @param {string} module
 * @param {object} meta contains a list of metadata of the event
 * @param {function} cb callback
 */

EventSchema.statics.track = function (type, ids, name, module, meta, cb) {

  if (arguments.length !== 6) {
    throw new Error('Event.track: Expected six arguments');
  }

  var newEvent = {
    aid: ids.aid,
    cid: ids.cid,
    module: module,
    meta: metadata.toArray(meta),
    name: name,
    type: type,
    uid: ids.uid
  };

  Event.create(newEvent, cb);
};


EventSchema.statics.page = function (ids, path, cb) {

  var newEvent = {
    aid: ids.aid,
    cid: ids.cid,
    name: path,
    type: 'page',
    uid: ids.uid
  };

  Event.create(newEvent, cb);
};


/**
 * Create a new 'auto' (automessage) event
 *
 * This helps in identifying which users have already been sent an automessage
 *
 * To query for an automessage:

        var query = {
          type: 'auto',
          amId: ids.amId,
          amState: 'sent'
        };

        Event.find(query, function (err, amsg) {
          cb();
        });
 *
 *
 * @param {object} ids contains the aid, amId, uid
 * @param {string} state sent/seen/clicked/replied
 * @param {string} title the title of the automessage
 * @param {function} cb callback
 *                      @param {object} err error
 *                      @param {boolean} updatedExisting if-new-event-created
 */

EventSchema.statics.automessage = function (ids, state, title, cb) {

  if (!ids.aid || !ids.uid || !ids.amId) {
    return cb(new Error('aid/uid/amId are required for automessage events'));
  }


  if (!_.contains(['queued', 'sent', 'seen', 'clicked', 'replied'], state)) {
    return cb(new Error(
      'automessage state must be one of queued/sent/seen/clicked/replied'));
  }


  var newEvent = {
    aid: ids.aid,
    amId: ids.amId,
    amState: state,
    name: title,
    type: 'auto',
    uid: ids.uid
  };

  var conditions = {
    aid: ids.aid,
    uid: ids.uid,
    amId: ids.amId,
    amState: state
  };

  var update = {
    $setOnInsert: newEvent
  };

  var options = {
    upsert: true
  };

  Event.update(conditions, update, options, function (err, numberAffected, raw) {
    if (err) return cb(err);
    var updatedExisting = raw.updatedExisting;
    cb(null, updatedExisting);
  });
};


var Event = mongoose.model('Event', EventSchema);


module.exports = Event;
