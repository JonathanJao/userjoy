/**
 * Model for conversations belonging to an app
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
 * Define conversation schema
 */

var ConversationSchema = new Schema({


  // assignee
  accId: {
    type: Schema.Types.ObjectId,
    ref: 'Account'
  },


  // app Id
  aid: {
    type: Schema.Types.ObjectId,
    ref: 'App',
    required: [true, 'Invalid aid']
  },


  // is the conversation closed
  closed: {
    type: Boolean,
    default: false
  },


  // created at timestamp
  ct: {
    type: Date,
    default: Date.now
  },


  // subject
  sub: {
    type: String
  },


  // TODO: tid

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

ConversationSchema.pre('save', function (next) {
  this.ut = new Date;
  next();
});


var Conversation = mongoose.model('Conversation', ConversationSchema);

module.exports = Conversation;
