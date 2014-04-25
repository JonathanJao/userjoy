/**
 * Model for messages belonging to an app
 */


/**
 * npm dependencies
 */

var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var troop = require('mongoose-troop');

var Schema = mongoose.Schema;


/**
 * Define message schema
 */

var MessageSchema = new Schema({


  accid: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Invalid account id']
  },


  // app Id
  aid: {
    type: Schema.Types.ObjectId,
    ref: 'App',
    required: [true, 'Invalid aid']
  },


  clicked: {
    type: Boolean,
    default: false
  },


  coId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'Invalid conversation id']
  },


  // created at timestamp
  ct: {
    type: Date,
    default: Date.now
  },


  // is it from a user or an account
  from: {
    type: String,
    required: [true, 'Provide valid from type, either user/account'],
    enum: ['user', 'account']
  },


  // parent message id
  mId: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },


  // name / email of user
  name: {
    type: String,
    required: [true, 'Provide name/email of user']
  },


  replied: {
    type: Boolean,
    default: false
  },


  text: {
    type: String,
    required: [true, 'Provide message text']
  },


  type: {
    type: String,
    required: [true, 'Provide message type'],
    enum: ['email', 'notification']
  },


  seen: {
    type: Boolean,
    default: false
  },


  sent: {
    type: Boolean,
    default: false
  },


  // user Id
  uid: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Invalid uid']
  },


  // updated at timestamp
  ut: {
    type: Date,
    default: Date.now
  }

});


/**
 * Adds updated (ut) timestamps
 * Created timestamp (ct) is added by default
 */

MessageSchema.pre('save', function (next) {
  this.ut = new Date;
  next();
});


/**
 * Finds messages belonging to an app, sent from users, sorted by created
 * timestamp
 *
 * @param {string} aid app id
 * @param {function} cb callback
 */

MessageSchema.statics.fetchInbox = function (aid, cb) {

  Message
    .find({
      aid: aid,
      from: 'user'
    })
    .select({
      ct: 1,
      name: 1,
      replied: 1,
      seen: 1,
      text: 1
    })
    .sort({
      ct: -1
    })
    .exec(cb);

};


/**
 * Finds unseen messages belonging to an app, sent from users, sorted by
 * created timestamp
 *
 * @param {string} aid app id
 * @param {function} cb callback
 */

MessageSchema.statics.fetchUnseen = function (aid, cb) {

  Message
    .find({
      aid: aid,
      from: 'user',
      seen: false
    })
    .select({
      ct: 1,
      name: 1,
      replied: 1,
      seen: 1,
      text: 1
    })
    .sort({
      ct: -1
    })
    .exec(cb);

};


var Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
