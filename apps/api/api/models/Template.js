/**
 * Model for templates belonging to an app
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
 * Define template schema
 */

var TemplateSchema = new Schema({


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
    type: Number,
    default: 0
  },


  // created at timestamp
  ct: {
    type: Date,
    default: Date.now
  },


  name: {
    type: String
  },


  replied: {
    type: Number,
    default: 0
  },


  seen: {
    type: Number,
    default: 0
  },


  sent: {
    type: Number,
    default: 0
  },


  // subject (for email type)
  sub: {
    type: String
  },


  title: {
    type: String
  },


  type: {
    type: String,
    required: [true, 'Provide template type'],
    enum: ['email', 'notification']
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

TemplateSchema.pre('save', function (next) {
  this.ut = new Date;
  next();
});


var Template = mongoose.model('Template', TemplateSchema);

module.exports = Template;
