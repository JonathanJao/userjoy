/**
 * NPM dependencies
 */

var _ = require('lodash');
var async = require('async');
var cors = require('cors');
var router = require('express')
  .Router();


/**
 * Models
 */

var App = require('../models/App');
var Conversation = require('../models/Conversation');
var Notification = require('../models/Notification');
var User = require('../models/User');


/**
 * Lib
 */

var track = require('../lib/track');


/**
 * Helpers
 */

var logger = require('../../helpers/logger');


/**
 * Add CORS support for all /track routes
 */

router.use(cors());


/**
 * GET /track
 *
 *
 * =======================
 * PSEUDOCODE
 * =======================
 * NOTES:
 *
 * - create a user cookie (dodatado.uid, 2 years) for an identified user
 * - create a session cookie (dodatado.sid, 30 minutes) for an user session
 * - create a company cookie (dodatado.cid, 2 years) for an user session
 * =======================
 * Input
 * =======================
 *
 *  app
 *  session
 *  user || user cookie
 *  company (optional)
 *  event
 *
 * =======================
 * Authenticate
 * =======================
 *
 * fetch app with apikey = dodatado id
 * check if url == request url
 * else return
 *
 *
 * =======================
 * Create Event
 * =======================
 *
 * if no user input or no session input
 *   return
 *
 * if no session id
 *   create session
 * else
 *   fetch session
 *   if not valid session (uid, aid)
 *     create new session
 *
 * create event
 *
 * send session id cookie
 *
 * =======================
 * Create Session
 * =======================
 *
 * if no user input
 *   return
 *
 * if company input
 *   fetch company
 *   if company does not exist
 *     create company
 *
 * fetch user
 * if no user
 *   create user
 *
 * create session
 *
 */

router
  .route('/')
  .get(function (req, res, next) {


    var data = req.query;
    var appKey = data.app_id;
    var user = data.user;
    var url = req.host;
    console.log('   /track', req.cookies);


    // fetch values from cookies
    var uid = req.cookies['dodatado.uid'];
    var sid = req.cookies['dodatado.sid'];
    var cid = req.cookies['dodatado.cid'];


    // Validations

    if (!appKey) {
      return res.badRequest('Please send app_id with the params');
    }


    // if both the user identifier and user cookie are not present, respond
    // with an error
    if (!(user || uid)) {
      return res.badRequest('Please send user_id or email to identify user');
    }

    user = JSON.parse(user);

    if (!(user.email || user.user_id)) {
      return res.badRequest('Please send user_id or email to identify user');
    }


    async.waterfall([

        function findAndVerifyApp(cb) {

          App
            .findByKey(appKey, function (err, app) {
              if (err) {
                return cb(err);
              }

              if (!app) {
                return cb(new Error('App Not Found'));
              }

              cb(null, app);

            });

        },

        function checkOrCreateCompany(cb) {

          // if valid cid, move on
          // else if no valid company object, move on
          // else getOrCreate company

          if (cid) {
            return cb();
          }

          if (!company) {
            return cb();
          }

          // TODO : getOrCreate company here
          cb();

        },


        function checkOrCreateUser(app, cb) {

          // if valid uid, move on
          // else getOrCreate user

          if (uid) {
            return cb(null, uid);
          }

          User.getOrCreate(app._id, user, function (err, usr) {
            cb(err, usr._id);
          });

        },


        function checkOrCreateSession(cb) {

          // if valid session id, move on
          // else create new session

          if (sid) {
            return cb();
          }

          // TODO create new session
          cb();
        },


        function createEvent(arguments) {

        }


      ],

      function (err, results) {

        if (err) return next(err);

        var resObj = {
          uid: 'user_id',
          cid: 'company_id',
          sid: 'session_id'
        };

        res.jsonp(resObj);

      });

  });



/**
 * GET /track/notifications
 *
 * @param {string} id user-id or email
 *
 * 1. Returns the most recent queued auto notification for the user
 * 2. Also contains the theme color of the notification / message-box
 */

router
  .route('/notifications')
  .get(function (req, res, next) {


    logger.trace({
      at: 'TrackController:getNotification',
      query: req.query,
      cookies: req.cookies
    });


    var data = req.query;
    var appKey = data.app_id;

    // user identifiers
    var email = data.email;
    var user_id = data.user_id;


    // VALIDATIONS

    // if appKey is not present, there is no way to identify an app
    if (!appKey) {
      return res.badRequest('Please send app_id with the params');
    }

    // if user identifier is not present, respond with an error
    if (!email && !user_id) {
      return res.badRequest('Please send user_id or email to identify user');
    }


    async.waterfall([


        function getApp(cb) {
          App.findByKey(appKey, function (err, app) {

            if (err) return cb(err);
            if (!app) return cb(new Error('APP_NOT_FOUND'));
            cb(null, app);
          });
        },


        function findUser(app, cb) {

          var conditions = {
            aid: app._id
          };

          if (user_id) {
            conditions.user_id = user_id;
          } else if (email) {
            conditions.email = email;
          } else {
            return cb(new Error('Please send user_id or email'));
          }

          User.findOne(conditions, function (err, user) {
            cb(err, user, app);
          });
        },


        function getNotification(user, app, cb) {

          var conditions = {
            uid: user._id
          };

          // get the latest notification
          var options = {
            sort: {
              ct: -1
            }
          };

          Notification.findOneAndRemove(conditions, options, function (err, notf) {
            cb(err, notf, app);
          });

        }


      ],


      function callback(err, notification, app) {

        if (err) {

          if (err.message === 'INVALID_APP_KEY') {
            return res.badRequest('Provide valid app id');
          }

          if (err.message === 'APP_NOT_FOUND') {
            return res.badRequest('Provide valid app id');
          }

          return next(err);
        }

        // pass the theme color alongwith the notification
        notification = notification ? notification.toJSON() : {};
        notification.color = app.color;


        res
          .status(200)
          .json(notification);

      });


  });



/**
 * POST /track/conversations
 *
 * Creates a new conversation
 *
 * If user is replying to a notification, then the amId must be there
 */

router
  .route('/conversations')
  .post(function (req, res, next) {

    logger.trace({
      at: 'TrackController:createConversation',
      body: req.body,
      cookies: req.cookies
    });

    var data = req.body;
    var appKey = data.app_id;
    var body = data.body;

    // if the message is a reply to a conversation, then it should have the
    // the amId
    var amId = data.amId;

    // user identifiers
    var email = data.email;
    var user_id = data.user_id;


    // VALIDATIONS : START //////////////////

    if (!appKey) {
      return res.badRequest('Please send app_id with the params');
    }

    // if user identifier is not present, respond with an error
    if (!email && !user_id) {
      return res.badRequest('Please send user_id or email to identify user');
    }

    // is message body is not present, send bad request error
    if (!body) {
      return res.badRequest('Please write a message');
    }

    // VALIDATIONS : END ////////////////////



    async.waterfall([


        function getApp(cb) {
          App.findByKey(appKey, function (err, app) {
            if (err) return cb(err);
            if (!app) return cb(new Error('APP_NOT_FOUND'));
            cb(null, app);
          });
        },


        function findUser(app, cb) {

          var conditions = {
            aid: app._id
          };

          if (user_id) {
            conditions.user_id = user_id;
          } else if (email) {
            conditions.email = email;
          } else {
            return cb(new Error('Please send user_id or email'));
          }

          User.findOne(conditions, cb);
        },


        function createConversation(user, cb) {

          var newCon = {
            aid: user.aid,
            messages: [],
            sub: 'Message from ' + user.email,
            uid: user._id
          };


          // if amId is present
          if (amId) newCon.amId = amId;


          var msg = {
            body: body,

            // add from as 'user'
            from: 'user',

            // type should be notification
            type: 'notification',

            // add sender name 'sName' as user's name or email
            // TODO: Check is user.name will work
            sName: user.name || user.email

          };

          newCon.messages.push(msg);

          Conversation.create(newCon, cb);
        }

      ],


      function callback(err, conversation) {

        if (err) {

          if (err.message === 'INVALID_APP_KEY') {
            return res.badRequest('Provide valid app id');
          }

          if (err.message === 'APP_NOT_FOUND') {
            return res.badRequest('Provide valid app id');
          }

          return next(err);
        }

        res
          .status(201)
          .json(conversation);

      });


  });



/**
 * Expose router
 */

module.exports = router;
