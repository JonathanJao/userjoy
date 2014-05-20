/**
 * Module dependencies
 */

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

var isAuthenticated = require('../policies/isAuthenticated');
var hasAccess = require('../policies/hasAccess');


/**
 * Helpers
 */

var logger = require('../../helpers/logger');


/**
 * All routes below need to be authenticated
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
 * GET /apps/:aid/users/:uid
 *
 * Returns user profile
 */

router
  .route('/:aid/users/:uid')
  .get(function (req, res, next) {

    logger.trace({
      at: 'UserController:getUser',
      params: req.params
    });

    User
      .findOne({
        _id: req.params.uid,
        aid: req.params.aid
      })
      .exec(function (err, user) {

        if (err) return next(err);
        if (!user) return res.notFound();

        res
          .status(200)
          .json(user);

      });

  });


/**
 * GET /apps/:aid/users/:uid/conversations
 *
 * Returns 10 latest conversations of the user
 */

router
  .route('/:aid/users/:uid/conversations')
  .get(function (req, res, next) {

    logger.trace({
      at: 'UserController:getMessages',
      params: req.params
    });

    Conversation
      .find({
        uid: req.params.uid,
        aid: req.params.aid
      })
      .sort({
        ct: -1
      })
      .limit(10)
      .exec(function (err, conversations) {

        if (err) return next(err);

        res
          .status(200)
          .json(conversations);

      });

  });


module.exports = router;
