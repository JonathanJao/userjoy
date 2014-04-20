/**
 * Bootstrap the test database
 * before running tests
 */


/**
 * npm dependencies
 */

var async = require('async');
var ObjectId = require('mongoose')
  .Types.ObjectId;


/**
 * models
 */

var Account = require('../../api/models/Account');
var App = require('../../api/models/App');
var Message = require('../../api/models/Message');


var accounts = {

  first: {
    name: 'Prateek',
    email: 'test@userjoy.co',
    password: 'testtest'
  },

  second: {
    name: 'Savinay',
    email: 'savinay@example.com',
    password: 'newapptest'
  },
},

  apps = {

    first: {
      name: 'First App',
      domain: 'firstapp.co'
    },

    second: {
      name: 'Second App',
      domain: 'secondapp.co'
    }
  },

  messages = {

    first: {
      accid: null,
      aid: null,
      coId: ObjectId(),
      from: 'user',
      text: 'Hello World',
      type: 'email',
      uid: ObjectId(),
    },

    second: {
      accid: null,
      aid: null,
      coId: ObjectId(),
      from: 'user',
      text: 'Hello World 2',
      type: 'email',
      uid: ObjectId(),
    }
  };


function createAccount(account, fn) {

  var rawPassword = account.password;
  Account.create(account, function (err, acc) {
    if (err) return fn(err);
    acc.password = rawPassword;
    fn(null, acc);
  });

}

function createApp(accId, app, fn) {

  app.admin = accId;
  App.create(app, fn);

}

function createMessage(accId, aid, message, fn) {

  message.accid = accId;
  message.aid = aid;
  Message.create(message, fn);

}


module.exports = function loadFixtures(callback) {

  async.series({

    createFirstAccount: function (cb) {

      createAccount(accounts.first, function (err, acc) {
        if (err) return cb(err);
        accounts.first = acc;
        cb();
      });

    },

    createSecondAccount: function (cb) {

      createAccount(accounts.second, function (err, acc) {
        if (err) return cb(err);
        accounts.second = acc;
        cb();
      });

    },

    createFirstApp: function (cb) {

      createApp(accounts.first._id, apps.first, function (err, app) {
        if (err) return cb(err);
        apps.first = app;
        cb();
      });

    },

    createSecondApp: function (cb) {

      createApp(accounts.second._id, apps.second, function (err, app) {
        if (err) return cb(err);
        apps.second = app;
        cb();
      });

    },

    createFirstMessage: function (cb) {

      var aid = apps.first._id;
      var accId = accounts.first._id;
      var message = messages.first;

      createMessage(accId, aid, message, function (err, msg) {
        if (err) return cb(err);
        messages.first = msg;
        cb();
      });

    },

    createSecondMessage: function (cb) {

      var aid = apps.first._id;
      var accId = accounts.first._id;
      var message = messages.second;

      createMessage(accId, aid, message, function (err, msg) {
        if (err) return cb(err);
        messages.second = msg;
        cb();
      });

    },

  }, function (err) {

    callback(err, {
      accounts: accounts,
      apps: apps,
      messages: messages
    });

  });
}
