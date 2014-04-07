/**
 * Model for users belonging to an app
 */


/**
 * Module dependencies
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  troop = require('mongoose-troop'),
  async = require('async'),
  _ = require('lodash'),
  validate = require('mongoose-validator')
    .validate;


/**
 * Define schema
 */

var UserSchema = new Schema({

  appId: {
    type: Schema.Types.ObjectId,
    ref: 'App',
    required: true
  },

  user_id: {
    type: String
  },

  email: {
    type: String
  },

  unsubscribed: {
    type: Boolean,
    default: false
  },

  unsubscribedAt: {
    type: Date
  },

  unsubscribedThrough: {
    messageId: {
      type: Schema.Types.ObjectId,
    },
    subject: {
      type: String
    }
  },

  lastContactedAt: {
    type: Date
  },

  totalSessions: {
    type: Number,
    default: 1
  },

  createdAt: {
    type: Date
  },

  lastSessionAt: {
    type: Date
  },

  lastHeardAt: {
    type: Date
  },

  healthScore: {
    type: Number
  }

  // tags [all tags this user belongs to]
  // notes
  // status (Free, Paying, Cancelled)
  // companies [{companyId, companyName}]

});


/**
 * Adds firstSessionAt and updatedAt timestamps
 */

UserSchema.plugin(troop.timestamp, {
  createdPath: 'firstSessionAt',
  modifiedPath: 'updatedAt',
  useVirtual: false
});


/**
 * If the user exists, fetch the user, else create a new user
 *
 * @param {String} app id
 * @param {Object} user object
 * @param {Function} callback function
 */

UserSchema.statics.getOrCreate = function (appId, user, cb) {

  var email = user.email;
  var user_id = user.user_id;
  var query = {};

  if (!(email || user_id)) {
    return cb(new Error('Please send user_id or email to identify user'));
  }

  // add appId to user
  user.appId = appId;

  // appId to query
  query.appId = appId;

  // add user_id or email to query
  if (user_id) {
    query.user_id = user_id;
  } else {
    query.email = email;
  }


  User
    .findOne(query)
    .exec(function (err, usr) {

      if (err) return cb(err);

      if (usr) return cb(null, usr);

      // user not found, create new user
      User
        .create(user, function (err, usr2) {

          if (err) return cb(err);

          if (!usr2) return cb(new Error('Error while creating user'));

          cb(null, usr2);

        });

    });

};


var User = mongoose.model('User', UserSchema);

module.exports = User;
