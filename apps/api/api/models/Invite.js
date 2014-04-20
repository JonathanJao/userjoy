/**
 * Model for invites belonging to an app
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
 * Define invite schema
 */

var InviteSchema = new Schema({


  // app Id
  aid: {
    type: Schema.Types.ObjectId,
    ref: 'App',
    required: [true, 'Invalid aid']
  },


  // created at timestamp
  ct: {
    type: Date,
    default: Date.now
  },


  from: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Invalid from-account id']
  },


  status: {
    type: String,
    required: [true, 'Invalid status'],
    enum: ['pending', 'cancelled', 'joined'],
    default: 'pending'
  },


  // invite is sent to this email
  to: {
    type: String,
    required: [true, 'Provide email']
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

InviteSchema.pre('save', function (next) {
  this.ut = new Date;
  next();
});

var Invite = mongoose.model('Invite', InviteSchema);

module.exports = Invite;
