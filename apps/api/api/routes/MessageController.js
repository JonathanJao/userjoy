/**
 * npm dependencies
 */

var async = require('async');
var router = require('express')
  .Router();


/**
 * Models
 */

var Conversation = require('../models/Conversation');
var Message = require('../models/Message');


/**
 * Policies
 */

var hasAccess = require('../policies/hasAccess');
var isAuthenticated = require('../policies/isAuthenticated');


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
 * GET /apps/:aid/messages
 *
 * Returns all messages for app
 */

router
  .route('/:aid/messages')
  .get(function (req, res, next) {

    var aid = req.app._id;

    Message
      .fetchInbox(aid, function (err, messages) {

        if (err) {
          return next(err);
        }

        res.json(messages || []);

      });

  });


/**
 * GET /apps/:aid/messages/:mId
 *
 * Returns all messages belonging to message thread
 */

router
  .route('/:aid/messages/:mId')
  .get(function (req, res, next) {

    var aid = req.app._id;
    var mId = req.params.mId;

    Message
      .fetchThread(aid, mId, function (err, messages) {
        if (err) {
          return next(err);
        }

        res.json(messages || []);

      });

  });


/**
 * POST /apps/:aid/messages
 *
 * Creates and sends a new message
 */

router
  .route('/:aid/messages')
  .post(function (req, res, next) {

    var newMessage = req.body;
    var accid = req.user._id;
    var aid = req.app._id;
    var sub = newMessage.sub;
    var uid = newMessage.uid;

    // since this is a multi-query request (transaction), we need to make all
    // input validations upfront
    // uid, subject, text, type
    if (!(uid && aid && sub && newMessage.text && newMessage.type)) {
      return res.badRequest('Missing uid/sub/text/type');
    }

    async.waterfall(
      [

        // create new conversation
        function (cb) {

          var newConversation = {
            accId: accid,
            aid: aid,
            sub: sub,
            uid: uid
          };

          Conversation.create(newConversation, function (err, con) {
            cb(err, con);
          });
        },


        // create new message
        function (conversation, cb) {

          // add from as 'account'
          newMessage.from = 'account';
          newMessage.accid = accid;
          newMessage.aid = aid;
          newMessage.coId = conversation._id;

          Message.create(newMessage, function (err, msg) {
            cb(err, msg);
          });

        },

        // send message through mandrill
        function (msg, cb) {
          // TODO : send the message through mandrill
          cb(null, msg);
        }

      ],

      function (err, msg) {

        if (err) {
          return next(err);
        }

        res.json(msg, 201);
      }
    );

  });


/**
 * POST /apps/:aid/messages/:mId
 *
 * Creates and sends a reply for a message
 */

router
  .route('/:aid/messages/:mId')
  .post(function (req, res, next) {

    var reply = req.body;
    var accid = req.user._id;
    var aid = req.app._id;
    var mId = req.params.mId;

    // since this is a multi-query request (transaction), we need to make all
    // input validations upfront
    // text, type
    if (!(reply.text && reply.type)) {
      return res.badRequest('Missing uid/sub/text/type');
    }

    async.waterfall(
      [

        // fetch parent message
        function (cb) {
          Message.replied(mId, function (err, msg) {
            cb(err, msg);
          });
        },


        // create new message
        function (parentMsg, cb) {

          reply.accid = accid;
          reply.aid = aid;
          reply.coId = parentMsg.coId;

          // add from as 'account'
          reply.from = 'account';
          reply.sub = parentMsg.sub;
          reply.uid = parentMsg.uid;

          // reply type is always email
          reply.type = 'email';

          Message.create(reply, function (err, msg) {
            cb(err, msg);
          });

        },

        // send message through mandrill
        function (msg, cb) {
          // TODO : send the message through mandrill is type is email
          cb(null, msg);
        }

      ],

      function (err, msg) {

        if (err) {
          return next(err);
        }

        res.json(msg, 201);
      }
    );

  });


module.exports = router;
