/**
 * npm dependencies
 */

var _ = require('lodash');
var async = require('async');
var juice = require('juice2');
var nodemailer = require('nodemailer');
var path = require('path');


/**
 * directory path vars
 */

var templatesDir = path.resolve(__dirname, '../..', 'email_templates');


var MAILGUN_USER = 'postmaster@mail.userjoy.co';
var MAILGUN_PASS = '5k0o37dg6od7';
var UJ_SUPPORT_EMAIL = 'support@userjoy.co';
var UJ_SUPPORT_NAME = 'UserJoy';


/**
 * Helpers
 */

var logger = require('../../helpers/logger');
var render = require('../../helpers/render-message');


/*
USAGE:

var options = {
  locals: {
    user: {
      name: 'Prateek'
    }
    body: 'This is what I wanted to send to {{= user.name || "you" }}'
  },
  from: {
    email: '532d6bf862d673ba7131812e@mail.userjoy.co',
    name: 'Prateek from UserJoy'
  },
  metadata: {
    'mId': '535d131c67d02dc60b2b1764'
  },
  replyTo: {
    email: '532d6bf862d673ba7131812e+535d131c67d02dc60b2b1764@mail.userjoy.co',
    name: 'Reply to Prateek from UserJoy'
  },
  subject: 'Welcome to UserJoy',
  to: {
    email: 'prattbhatt@gmail.com',
    name: 'Prateek Bhatt'
  },
};
mailer.sendToUser(options);

* /



/**
 * @constructor Mailer
 */

function Mailer(opts) {

  this.locals = opts.locals;
  this.subject = opts.subject;

  // in case of automessages, the message body must be provided.
  // the message body should be in ejs format,
  // and will be rendered before sending the email
  this.body = opts.body || null;

  // if there is template file, then this should be defined
  this.template = null;

  this.aid = opts.aid;

  this.fromEmail = opts.from.email;
  this.fromName = opts.from.name;


  this.mId = opts.mId;

  if (opts.replyTo) {
    this.replyToEmail = opts.replyTo.email;
    this.replyToName = opts.replyTo.name;
  }


  this.toEmail = opts.to.email;
  this.toName = opts.to.name;


  this.html = null;

  return this;
}


// Prepare nodemailer transport object
Mailer.prototype.transport = nodemailer.createTransport("SMTP", {
  // secureConnection: true,
  host: 'smtp.mailgun.org',
  port: 587,
  auth: {
    user: MAILGUN_USER,
    pass: MAILGUN_PASS
  }
});


/**
 * Prepend name to email
 * e.g. "Prateek Bhatt <prattbhatt@gmail.com>"
 *
 * @param {string} email
 * @param {string} name
 * @return {string} full email address
 */

Mailer.prototype.createAddress = function (email, name) {
  if (name) {
    email = name + ' <' + email + '>';
  }
  return email;
};


Mailer.prototype.options = function () {

  var opts = {
    from: this.createAddress(this.fromEmail, this.fromName),
    to: this.createAddress(this.toEmail, this.toName),
    subject: this.subject,
    html: this.html,
    generateTextFromHTML: true,
  };

  if (this.replyToEmail) {
    opts.replyTo = this.createAddress(this.replyToEmail, this.replyToName);
  }


  if (this.metadata) {
    opts.headers = {

      // REF: http://documentation.mailgun.com/user_manual.html#sending-via-smtp
      'X-Mailgun-Track': 'yes',
      'X-Mailgun-Track-Clicks': 'yes',
      'X-Mailgun-Track-Opens': 'yes',


      // REF: http://documentation.mailgun.com/user_manual.html#attaching-data-to-messages
      'X-Mailgun-Variables': this.metadata
    };
  }

  // in test env, do not send emails
  // REF 1: http://documentation.mailgun.com/user_manual.html#sending-via-smtp
  // REF 2: http://documentation.mailgun.com/user_manual.html#sending-in-test-mode
  if (!_.contains(['production', 'development'], process.env.NODE_ENV)) {
    opts.headers = opts.headers || {};
    opts.headers['X-Mailgun-Drop-Message'] = 'yes';
    logger.trace({
      at: 'mailer',
      key: 'Using Mailgun Test Mode'
    });
  }


  return opts;

};


/**
 * sends email with the proper template
 */

Mailer.prototype._sendMail = function (cb) {

  var self = this;
  var opts = self.options();

  self.transport.sendMail(opts, function (err, responseStatus) {

    logger.trace({
      at: 'mailer',
      err: err,
      res: responseStatus,
      opts: opts
    });

    cb(err, responseStatus);
  });

};


Mailer.prototype.send = function (cb) {

  var self = this;
  var templatePath = path.join(templatesDir, this.template);

  render.file(templatePath, this.locals, function (err, html, text) {


    // FIXME : put this in the config file before production
    var opts = {
      url: path.resolve(__dirname, '../../email_templates')
    };

    // inline the html
    juice.juiceContent(html, opts, function (err, inlinedHtml) {
      self.html = inlinedHtml;
      self._sendMail.call(self, cb);
    });

  });

};


/**
 * Sends email confirmation email
 *
 * @param  {object} options contains the email and other local variables
 */

exports.sendConfirmation = function (options, cb) {

  options.from = {
    name: UJ_SUPPORT_NAME,
    email: UJ_SUPPORT_EMAIL
  };

  options.subject = 'Welcome to UserJoy';

  var mailer = new Mailer(options);
  mailer.template = 'email-confirmation.ejs';
  mailer.send(cb);
};


/**
 * Sends auto mails from an app to a user
 *
 * @param {object} options
 * @param {function} cb callback
 */

exports.sendAutoMessage = function (options, cb) {
  var mailer = new Mailer(options);
  mailer.template = 'automessage.ejs';
  mailer.send(cb);
};


/**
 * Sends mail to user from app, manually from dashboard
 *
 * @param {object} options
 * @param {function} cb callback
 */

exports.sendManualMessage = function (options, cb) {
  var mailer = new Mailer(options);

  mailer.template = 'user-conversation.ejs';

  mailer.send(cb);
};


/**
 * Sends invite to a new email, to join as a team member
 *
 * @param {object} options
 * @param {function} cb callback
 */

exports.sendInvite = function (options, cb) {

  options.from = {
    name: UJ_SUPPORT_NAME,
    email: UJ_SUPPORT_EMAIL
  };

  options.subject = 'Invite to join UserJoy';

  var mailer = new Mailer(options);
  mailer.template = 'invite.ejs';
  mailer.send(cb);
};

/**
 * Sends installation code to developer
 *
 * @param {object} options
 * @param {function} cb callback
 */

exports.sendInstallCode = function (options, cb) {

  options.from = {
    name: UJ_SUPPORT_NAME,
    email: UJ_SUPPORT_EMAIL
  };

  options.subject = 'Install Code for UserJoy';

  var mailer = new Mailer(options);
  mailer.template = 'install-code.ejs';
  mailer.send(cb);
};

/**
 * FOR TESTING PURPOSE
 *
 * @param {object} options
 * @param {function} cb callback
 */

exports.sendTestMail = function (options, cb) {
  options.from = {
    name: UJ_SUPPORT_NAME,
    email: UJ_SUPPORT_EMAIL
  };

  options.subject = 'Email Confirmation UserJoy';

  var mailer = new Mailer(options);
  mailer.template = 'email-confirmation.ejs';
  mailer.send(cb);
}
