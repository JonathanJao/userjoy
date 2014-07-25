/**
 * Module dependencies
 */

var router = require('express')
  .Router(),
  async = require('async'),
  passport = require('passport');


/**
 * Models
 */

var Account = require('../models/Account');


/**
 * Passport js configuration
 */

require('../services/passport');


/**
 * POST /auth/login
 */

router.post('/login', function (req, res, next) {

  passport.authenticate('local', function (err, user, info) {

    if ((err) || (!user)) {
      return res.badRequest(info && info.message ? info.message :
        'Forbidden');
    }


    // if account has not verified its email, then do not allow to login
    // if (!user.emailVerified) {
    //   return res.forbidden('EMAIL_NOT_VERIFIED');
    // }


    req.login(user, function (err) {

      if (err) {
        return res.badRequest(err);
      }

      return res
        .status(200)
        .json({
          message: 'Logged In Successfully'
        });

    });

  })(req, res, next);

});

/**
 * POST /auth/logout
 * Logs out user
 */

router.post('/logout', function (req, res, next) {

  req.logout();
  res
    .status(200)
    .json({
      message: 'Logged Out Successfully'
    });

});

module.exports = router;
