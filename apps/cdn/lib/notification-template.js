module.exports = function anonymous(obj) {

  function escape(html) {
    return String(html)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  function section(obj, prop, negate, str) {
    var val = obj[prop];
    if ('function' == typeof val) return val.call(obj, str);
    if (negate) val = !val;
    if (val) return str;
    return '';
  };

  return "<div id=\"" + escape(obj.NOTIFICATION_TEMPLATE_ID) + "\" style=\"position: absolute; z-index: 99999999; right: 0; margin-left: auto; margin-right: 3px;\">\n    <div style=\"float:right; width: 350px; margin-top: 50px;\">\n        <div class=\"uj-message-template\" style=\"min-height: 175px; max-height: 175px; overflow: auto; border-color: " + escape(obj.color) + "; border-right: 1px solid " + escape(obj.color) + ";border-top: 1px solid " + escape(obj.color) + "; border-bottom: 1px solid " + escape(obj.color) + "; border-radius: 4px; z-index: 99999999; background-color: #fefefe;\">\n            <button type=\"button\" class=\"uj-close\" aria-hidden=\"true\" onclick=\"userjoy.hideNotification()\" style=\"margin-top: -15px;\">&times;</button>\n            <img src=\"" + escape(obj.gravatar) + "\" width=\"60px\">\n            <div style=\"margin-top: -75px; margin-left: 75px;\">\n                <p style=\"margin-top: 12px;\"><b>" + escape(obj.senderName) + "</b></p>\n                <p>" + obj.body + "</p>\n            </div>\n            <span id=\"" + escape(obj.SENT_TEMPLATE_ID) + "\" style=\"display:none; color: #7f8c8d; position: absolute; bottom: 70px;\">Message Sent. Thanks!</span>\n            <span id=\"" + escape(obj.ERROR_ID) + "\" style=\"display:none; color: #a94442; position: absolute; bottom: 70px;\">Your reply cannot be blank</span>\n            <br>\n            <div style=\"position: absolute; bottom: 60px; right: 5px;\">\n                <small style=\"color: #95a5a6;\">Powered by <a style=\"text-decoration:none; color: " + escape(obj.color) + "\" href=\"http://www.userjoy.co\", target=\"_blank\">UserJoy</a></small>\n            </div>\n        </div>\n        <div class=\"uj-panel-footer\" style=\"margin-top: -23px; z-index: 99999999\">\n            <div class=\"uj-input-group\">\n                <textarea id=\"" + escape(obj.REPLY_TEMPLATE_ID) + "\" type=\"text\" name=\"msg\" class=\"uj-form-control uj-input-sm\" placeholder=\"Reply here...\" style=\"margin-top: 3px; height: 34px;\"></textarea>\n                <span class=\"uj-input-group-btn\">\n                <button id=\"" + escape(obj.SEND_MESSAGE_NOTIFICATION_ID) + "\" class=\"uj-btn uj-btn-sm\" id=\"btn-chat\" type=\"button\" onclick=\"userjoy.replyNotification()\" style=\"margin-top: 3px; height: 34px; color: #fff; background-color: " + escape(obj.color) + "; border-color: " + escape(obj.color) + "\">\n                Send</button>\n                </span>\n            </div>\n        </div>\n    </div>\n</div>\n"
}