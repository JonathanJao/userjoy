var ajax = require('ajax');
var app = require('./app');
var bind = require('bind');
var callback = require('callback');
var canonical = require('canonical');
var clone = require('clone');
var company = require('./company');
var cookie = require('./cookie');
var debug = require('debug')('uj:userjoy');
var defaults = require('defaults');
var each = require('each');
var is = require('is');
var isEmail = require('is-email');
var isMeta = require('is-meta');
var json = require('json');
var message = require('./message');
var newDate = require('new-date');
var notification = require('./notification');
var on = require('event')
  .bind;
var prevent = require('prevent');
var querystring = require('querystring');
var queue = require('./queue');
var size = require('object')
  .length;
var url = require('url');
var user = require('./user');


/**
 * Expose `UserJoy`.
 */

module.exports = UserJoy;


/**
 * Initialize a new `UserJoy` instance.
 */

function UserJoy() {
  this.debug = debug;
  this._timeout = 20000;
  this.TRACK_URL = 'http://api.do.localhost/track';
  this.IDENTIFY_URL = 'http://api.do.localhost/track/identify';
  this.COMPANY_URL = 'http://api.do.localhost/track/company';

  bind.all(this);
}


/**
 * Initialize.
 *
 * @return {UserJoy}
 */

UserJoy.prototype.initialize = function () {
  var self = this;

  this.debug('initialize');

  // set the app id
  this.aid = window._userjoy_id;

  // set tasks which were queued before initialization
  queue
    .create(window.userjoy)
    .prioritize();

  // invoke queued tasks
  this._invokeQueue();

  app.identify({
    app_id: window._userjoy_id,

    // FIXME change before production
    apiUrl: self.TRACK_URL
  });

  setTimeout(function () {

  }, 500)

  // FIXME: THIS CODE IS NOT TESTED
  notification.load(function (err) {

    self.debug('loaded', err);

    // load css file for message
    message.loadCss();

    message.load();
  });


  this.debug('INITIALIZED:: %o', this);

  return this;
};


/**
 * Invoke tasks which have been queued
 *
 * @return {UserJoy}
 */

UserJoy.prototype._invokeQueue = function () {
  for (var i = queue.tasks.length - 1; i >= 0; i--) {
    this.debug('_invokeQueue %o', queue.tasks);
    this.push(queue.tasks.shift());
  };

  return this;
};

/**
 * Identify a user by  `traits`.
 *
 * @param {Object} traits (optional)
 * @param {Function} fn (optional)
 * @return {UserJoy}
 */

UserJoy.prototype.identify = function (traits, fn) {
  var self = this;

  this.debug('identify');

  if (!is.object(traits)) {
    this.debug('err: userjoy.identify must be passed a traits object');
    return;
  }

  // if no user identifier, return
  if (!traits.user_id && !traits.email) {
    self.debug('userjoy.identify must provide the user_id or email');
    return;
  }

  user.identify(traits);

  var data = {
    app_id: self.aid,
    user: user.traits()
  };

  ajax({
    type: 'GET',
    url: self.IDENTIFY_URL,
    data: data,
    success: function (ids) {
      self.debug("identify success: %o", ids);
      ids || (ids = {});

      // set uid to cookie
      cookie.uid(ids.uid);
    },
    error: function (err) {
      self.debug("identify error: %o", err);
    }
  });

  this._callback(fn);
  return this;
};


/**
 * Identify a company by `traits`.
 *
 * @param {Object} traits (optional)
 * @param {Function} fn (optional)
 * @return {UserJoy}
 */

UserJoy.prototype.company = function (traits, fn) {
  var self = this;

  this.debug('company');

  if (!is.object(traits)) {
    this.debug('err: userjoy.company must be passed a traits object');
    return;
  }

  // if no company identifier, return
  if (!traits.company_id) {
    self.debug('userjoy.company must provide the company_id');
    return;
  }

  company.identify(traits);

  var data = {
    app_id: self.aid,
    company: company.traits()
  };

  ajax({
    type: 'GET',
    url: self.COMPANY_URL,
    data: data,
    success: function (ids) {
      self.debug("company success: %o", ids);
      ids || (ids = {});

      // set cid to cookie
      cookie.cid(ids.cid);
    },
    error: function (err) {
      self.debug("company error: %o", err);
    }
  });

  this._callback(fn);
  return this;
};


/**
 * Track an `event` that a user has triggered with optional `properties`.
 *
 * @param {String} event
 * @param {Object} properties (optional)
 * @param {Function} fn (optional)
 * @return {UserJoy}
 */

UserJoy.prototype.track = function (event, properties, fn) {


  this.debug('track', event, properties);

  if (is.fn(properties)) fn = properties, properties = null;


  // FIXME: add additional event types on the server: form, click

  this._sendEvent('feature', event, null, properties);

  this._callback(fn);
  return this;
};


/**
 * Helper method to track an outbound link that would normally navigate away
 * from the page before the analytics calls were sent.
 *
 * @param {Element or Array} links
 * @param {String or Function} event
 * @param {Object or Function} properties (optional)
 * @return {UserJoy}
 */

UserJoy.prototype.trackLink = function (links, event, properties) {
  if (!links) return this;
  if (is.element(links)) links = [links]; // always arrays, handles jquery

  // if no name attached to event, do not track
  if (!event) return this;

  var self = this;
  each(links, function (el) {
    on(el, 'click', function (e) {
      var ev = is.fn(event) ? event(el) : event;
      var props = is.fn(properties) ? properties(el) : properties;
      self.track(ev, props);

      if (el.href && el.target !== '_blank' && !isMeta(e)) {
        prevent(e);
        self._callback(function () {
          window.location.href = el.href;
        });
      }
    });
  });

  return this;
};


/**
 * Helper method to track an outbound form that would normally navigate away
 * from the page before the analytics calls were sent.
 *
 * @param {Element or Array} forms
 * @param {String or Function} event
 * @param {Object or Function} properties (optional)
 * @return {UserJoy}
 */

UserJoy.prototype.trackForm = function (forms, event, properties) {


  this.debug('trackForm')

  if (!forms) return this;
  if (is.element(forms)) forms = [forms]; // always arrays, handles jquery

  var self = this;
  each(forms, function (el) {
    function handler(e) {
      prevent(e);

      var ev = is.fn(event) ? event(el) : event;
      var props = is.fn(properties) ? properties(el) : properties;
      self.track(ev, props);

      self._callback(function () {
        el.submit();
      });
    }

    // support the events happening through jQuery or Zepto instead of through
    // the normal DOM API, since `el.submit` doesn't bubble up events...
    var $ = window.jQuery || window.Zepto;
    if ($) {
      $(el)
        .submit(handler);
    } else {
      on(el, 'submit', handler);
    }
  });

  return this;
};


/**
 * Trigger a pageview, labeling the current page with an optional `category`,
 * `name` and `properties`.
 *
 * @param {String} category (optional)
 * @param {String} name (optional)
 * @param {Object or String} properties (or path) (optional)
 * @param {Function} fn (optional)
 * @return {UserJoy}
 */

UserJoy.prototype.page = function (category, name, properties, fn) {

  if (category && !is.string(category)) return this; // SHOW ERROR

  if (is.fn(properties)) fn = properties, properties = null;
  if (is.fn(name)) fn = name, properties = name = null;
  if (is.object(name)) properties = name, name = null;
  if (is.string(category) && !is.string(name)) name = category, category =
    null;

  var defs = {
    path: canonicalPath(),
    referrer: document.referrer,
    title: document.title,
    url: canonicalUrl(),
    search: location.search
  };

  if (name) defs.name = name;

  name = defs.path;
  if (category) defs.category = category;

  properties = clone(properties) || {};
  defaults(properties, defs);

  this._sendEvent('pageview', name, category, properties);

  this._callback(fn);
  return this;
};


/**
 * Set the `timeout` (in milliseconds) used for callbacks.
 *
 * @param {Number} timeout
 */

UserJoy.prototype.timeout = function (timeout) {
  this._timeout = timeout;
};


/**
 * Callback a `fn` after our defined timeout period.
 *
 * @param {Function} fn
 * @return {UserJoy}
 * @api private
 */

UserJoy.prototype._callback = function (fn) {
  callback.async(fn, this._timeout);
  return this;
};


/**
 *
 * Send event data to UserJoy API
 *
 * @param {String} type of event
 * @param {Object} traits of event
 * @return {UserJoy}
 * @api private
 */

UserJoy.prototype._sendEvent = function (type, name, module, properties) {

  var self = this;
  // TODO: send data to userjoy api here

  var uid = cookie.uid();
  var cid = cookie.cid();

  var data = {
    app_id: self.aid,
    e: {
      type: type,
      name: name,
    },
    u: uid
  };

  if (cid) data.c = cid;

  if (module) data.e.feature = module;
  if (properties) data.e.meta = properties;


  ajax({
    type: 'GET',
    url: self.TRACK_URL,
    data: data,
    success: function (msg) {
      self.debug("success " + msg);
    },
    error: function (err) {
      self.debug("error " + err);
    }
  });

  return this;
};


/**
 * Push `args`.
 *
 * @param {Array} args
 * @api private
 */

UserJoy.prototype.push = function (args) {
  var method = args.shift();

  if (!this[method]) return;
  this[method].apply(this, args);
};

/**
 * Return the canonical path for the page.
 *
 * @return {String}
 */

function canonicalPath() {
  var canon = canonical();
  if (!canon) return window.location.pathname;
  var parsed = url.parse(canon);
  return parsed.pathname;
}

/**
 * Return the canonical URL for the page, without the hash.
 *
 * @return {String}
 */

function canonicalUrl() {
  var canon = canonical();
  if (canon) return canon;
  var url = window.location.href;
  var i = url.indexOf('#');
  return -1 == i ? url : url.slice(0, i);
}


/**
 * Expose function to hide notification
 */

UserJoy.prototype.hideNotification = notification.hide;


/**
 * Expose function to to reply to a notifiation
 */

UserJoy.prototype.replyNotification = notification.reply;


/**
 * Expose function to show conversation box
 */

UserJoy.prototype.showFeedback = message.show;


/**
 * Expose function to hide conversation box
 */

UserJoy.prototype.hideFeedback = message.hide;


/**
 * Expose function to send new conversation
 */

UserJoy.prototype.sendConversation = message.send;
