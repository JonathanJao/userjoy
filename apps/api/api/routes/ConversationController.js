/**
 * npm dependencies
 */

var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var router = require('express')
  .Router();


/**
 * Models
 */

var Conversation = require('../models/Conversation');
var User = require('../models/User');


/**
 * Policies
 */

var hasAccess = require('../policies/hasAccess');
var isAuthenticated = require('../policies/isAuthenticated');


/**
 * Services
 */

var mailer = require('../services/mailer');


/**
 * Helpers
 */

var appEmail = require('../../helpers/app-email');
var logger = require('../../helpers/logger');
var render = require('../../helpers/render-message');


/**
 * Creates the Reply-To email to track conversation threads
 *
 * e.g. '532d6bf862d673ba7131812e+535d131c67d02dc60b2b1764@mail.userjoy.co'
 */

function replyToEmailManual(fromEmail, conversationId) {
  var emailSplit = fromEmail.split('@');
  var emailLocal = emailSplit[0];
  var emailDomain = emailSplit[1];
  var email = emailLocal + '+' + conversationId + '@' + emailDomain;
  return email;
}


// add templateDate property to each message in the conversation for
// showing well formatted time in the emails
function addTemplateDate(conv) {
  conv = conv.toJSON();

  _.each(conv.messages, function (m) {
    m.templateDate = moment(m.ct)
      .format('D MMM, h:m a');
  });

  return conv;
}


/**
 * All routes on /apps
 * need to be authenticated
 */

router.use(isAuthenticated);


/**
 * For all routes with the ':aid'
 * param, we need to check if the
 * logged in user has access to the app
 *
 * The 'hasAccess' policy also attaches the
 * app object to the request object
 * e.g. req.app
 */

router.param('aid', hasAccess);


/**
 * PUT /apps/:aid/conversations/:coId/closed
 *
 * Closes the conversation
 */

router
  .route('/:aid/conversations/:coId/closed')
  .put(function (req, res, next) {

    var aid = req.params.aid;
    var coId = req.params.coId;

    if (!(aid && coId)) {
      return res.badRequest('Provide valid aid/coId');
    }


    // TODO: also take the aid as an input param as an additional check
    Conversation.closed(coId, function (err, msg) {
      if (err) return next(err);

      res
        .status(200)
        .json(msg);
    });

  });


/**
 * PUT /apps/:aid/conversations/:coId/reopened
 *
 * Reopens closed conversation
 */

router
  .route('/:aid/conversations/:coId/reopened')
  .put(function (req, res, next) {

    var aid = req.params.aid;
    var coId = req.params.coId;

    if (!(aid && coId)) {
      return res.badRequest('Provide valid aid/coId');
    }


    // TODO: also take the aid as an input param as an additional check
    Conversation.reopened(coId, function (err, msg) {
      if (err) return next(err);

      res
        .status(200)
        .json(msg);
    });

  });


/**
 * GET /apps/:aid/conversations
 *
 * @query {string} filter  open/closed (optional)
 *
 * Returns all open conversations for app
 */

router
  .route('/:aid/conversations')
  .get(function (req, res, next) {

    var aid = req.app._id;
    var filter = req.query.filter || 'open';

    var condition = {
      aid: aid
    };

    switch (filter) {

    case 'open':
      condition.closed = false;
      break;

    case 'closed':
      condition.closed = true;
      break;

    case 'unread':
      condition.toRead = true;
      break;

    default:
      // show open conversations by default
      condition.closed = false;
    }

    logger.debug({
      at: 'GET /conversations',
      condition: condition,
      filter: filter
    });

    Conversation
      .find(condition)
      .populate('assignee', 'name email')
      .populate('uid', 'email')
      .sort({
        ct: -1
      })
      .exec(function (err, conversations) {
        if (err) return next(err);
        res.json(conversations || []);
      });

  });


/**
 * GET /apps/:aid/conversations/:coId
 *
 * Returns a conversation alongwith all messages
 */

router
  .route('/:aid/conversations/:coId')
  .get(function (req, res, next) {

    var aid = req.app._id;
    var coId = req.params.coId;

    async.waterfall(
      [

        function findConversation(cb) {
          Conversation
            .findById(coId)
            .populate('assignee', 'name email')
            .populate('uid', 'email')
            .exec(cb);
        },

        function messagesAreOpened(con, cb) {

          // update seen status to true for all messages sent from user, which
          // belong to this thread
          Conversation.openedByTeamMember(con._id, function (err) {
            cb(err, con);
          });
        },

        function conversationIsRead(con, cb) {
          Conversation.isRead(con._id, function (err) {
            cb(err, con);
          });
        }

      ],

      function (err, con) {

        if (err) return next(err);

        res.json(con);
      }

    );

  });


/**
 * POST /apps/:aid/conversations
 *
 * NOTE: Only emails can be sent by manual messages now, notifications are not allowed
 *
 * Creates a new conversation, a new message and sends message to user
 */

router
  .route('/:aid/conversations')
  .post(function (req, res, next) {

    logger.trace({
      at: 'ConversationController:createConversation',
      params: req.params,
      body: req.body
    })

    var newMsg = req.body;
    var assignee = req.user._id;
    var aid = req.app._id;
    var sub = newMsg.sub;
    var uids = newMsg.uids;
    var fromEmail = appEmail(aid);

    // since this is a multi-query request (transaction), we need to make all
    // input validations upfront
    // uids, body, subject, type
    if (!(uids && aid && sub && newMsg.body && newMsg.type)) {
      return res.badRequest('Missing body/sub/type/uids');
    }

    // NOTE: only emails can be sent through manual messages now
    if (newMsg.type !== 'email') {
      return res.badRequest(
        'Only emails can be sent through manual messages');
    }

    if (!_.isArray(uids) || _.isEmpty(uids)) {
      return res.badRequest('Provide atleast on user id in the uids array');
    };


    async.waterfall(
      [

        function findUsers(cb) {

          User
            .find({
              _id: {
                $in: uids
              }
            })
            .select({
              name: 1,
              email: 1
            })
            .exec(cb);
        },


        function createMessages(users, cb) {

          var iterator = function (user, iteratorCB) {

            // locals to be passed for rendering the templates
            var locals = {
              user: user
            };

            // render body and subject
            newMsg.body = render.string(newMsg.body, locals);
            sub = render.string(newMsg.sub, locals);


            var newConversation = {
              aid: aid,
              assignee: assignee,
              messages: [],
              sub: sub,
              uid: user._id
            };

            newMsg.accid = assignee;

            // add from as 'account'
            newMsg.from = 'account';

            // add sender name 'sName' as account name
            newMsg.sName = req.user.name || req.user.email;


            newConversation.messages.push(newMsg);

            Conversation.create(newConversation, function (err, con) {

              if (err) return cb(err);

              con = con.toJSON();

              // NOTE: adding the toEmail and toNames to con to make
              // it simpler while mailing them
              con.toEmail = user.email;
              con.toName = user.name;

              // pass the modified con object for sending emails
              iteratorCB(null, con);
            });

          };

          async.map(users, iterator, function (err, cons) {
            cb(err, cons);
          });
        },


        function sendMessages(cons, cb) {

          // TODO: check if message is notification or email

          if (newMsg.type !== "email") return cb(err, messages);

          var iterator = function (conv, cb) {

            // add message dates
            conv = addTemplateDate(conv);

            var toEmail = conv.toEmail;
            var toName = conv.toName;

            // assume the reply message was the last message
            var msgId = _.last(conv.messages)
              ._id;

            var fromEmail = appEmail(aid);
            var fromName = req.user.name;
            var replyToEmail = replyToEmailManual(fromEmail, conv._id);

            var opts = {

              from: {
                email: fromEmail,
                name: fromName
              },

              locals: {
                conversation: conv
              },

              // pass the message id of the reply
              // this would be used to track if the message was opened
              metadata: {
                'mId': msgId
              },

              replyTo: {
                email: replyToEmail,
                name: 'Reply to ' + fromName
              },

              subject: conv.sub,

              to: {
                email: toEmail,
                name: toName
              }

            };

            mailer.sendManualMessage(opts, cb);
          };

          async.map(cons, iterator, function (err) {

            if (err) return cb(err);

            // the cons were modified in the last function, toEmail and toName
            // fields were added to make it easier for sending emails. remove
            // those fields before passing the response
            _.each(cons, function (c) {
              delete c.toEmail;
              delete c.toName;
            });


            cb(null, cons);
          });

        }

      ],

      function callback(err, cons) {

        if (err) return next(err);
        res
          .status(201)
          .json(cons);
      }
    );

  });


/**
 * POST /apps/:aid/conversations/:coId
 *
 * Creates and sends a reply message to a conversation
 */

router
  .route('/:aid/conversations/:coId')
  .post(function (req, res, next) {

    var reply = req.body;
    var accid = req.user._id;
    var aid = req.app._id;
    var coId = req.params.coId;

    // sName should be the name of the loggedin account or its primary email
    var sName = req.user.name || req.user.email;

    // since this is a multi-query request (transaction), we need to make all
    // input validations upfront
    // body
    if (!(reply.body)) {
      return res.badRequest('Missing body');
    }

    async.waterfall(
      [

        function createReplyMessage(cb) {

          reply.accid = accid;

          // add from as 'account'
          reply.from = 'account';

          reply.sName = sName;

          // reply type is always email
          reply.type = 'email';

          Conversation.reply(aid, coId, reply, function (err, con) {
            cb(err, con);
          });

        },

        function sendEmail(conv, cb) {

          User
            .findById(conv.uid)
            .select('email name')
            .exec(function (err, user) {

              // add message dates
              conv = addTemplateDate(conv);

              // assume the reply message was the last message
              var msgId = _.last(conv.messages)
                ._id;

              var fromEmail = appEmail(aid);
              var fromName = req.user.name;
              var replyToEmail = replyToEmailManual(fromEmail, conv._id);

              var opts = {

                from: {
                  email: fromEmail,
                  name: fromName
                },

                locals: {
                  conversation: conv
                },

                // pass the message id of the reply
                // this would be used to track if the message was opened
                metadata: {
                  'mId': msgId
                },

                replyTo: {
                  email: replyToEmail,
                  name: 'Reply to ' + fromName
                },

                subject: conv.sub,

                to: {
                  email: user.email,
                  name: user.name
                }

              };


              mailer.sendManualMessage(opts, function (err) {
                cb(err, conv);
              });

            })

        }

      ],

      function (err, con) {

        logger.debug('ConversationController Reply', {
          err: !! err,
          con: !! con
        });

        if (err) return next(err);
        res
          .status(201)
          .json(con);
      }
    );

  });


/**
 * PUT /apps/:aid/conversations/:coId/assign
 *
 * Assigns team member to conversation
 */

router
  .route('/:aid/conversations/:coId/assign')
  .put(function (req, res, next) {

    var assignee = req.body.assignee;
    var aid = req.params.aid;
    var coId = req.params.coId;

    if (!assignee) return res.badRequest(
      'Provide valid account id (assignee)')

    Conversation.assign(aid, coId, assignee, function (err, con) {

      if (err) return next(err);
      if (!con) return res.notFound('Conversation not found');


      var populate = {
        path: 'assignee',
        select: 'name email'
      };

      con.populate(populate, function (err, conversation) {
        if (err) return next(err);

        res
          .status(201)
          .json(conversation);
      })

    });
  });


module.exports = router;