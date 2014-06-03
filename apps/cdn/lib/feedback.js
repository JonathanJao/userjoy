var ajax = require('ajax');
var bind = require('bind');
var template = require('./feedback-template');


/**
 * Initialize a new `Feedback` instance.
 */

function Feedback() {
  this.fb_post_url = '/apps/aid/fb/uid';
  this.fb_template_id = 'uj_fb';
  this.userId = null;
}


Feedback.prototype.load = function (userId) {

  var self = this;

  self.userId = userId;

  function create(htmlStr) {
    var frag = document.createDocumentFragment();
    var temp = document.createElement('div');
    temp.innerHTML = htmlStr;
    while (temp.firstChild) {
      frag.appendChild(temp.firstChild);
    }
    return frag;
  }

  var fragment = create(template());

  var locals = {
    fb_template_id: self.fb_template_id
  };

  // You can use native DOM methods to insert the fragment:
  document.body.insertBefore(fragment, document.body.childNodes[0]);

};


Feedback.prototype.loadCss = function () {

  var self = this;
  var style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = 'body{font:14px/1.4 Georgia,serif}.foot{display:table-row;vertical-align:bottom;height:1px}body,html{height:100%}#wrap{min-height:100%}#main{overflow:auto;padding-bottom:150px}#footer{position:relative;margin-top:-150px;height:150px;clear:both}#page-wrap{width:75%;margin:80px auto}h1{font:700 36px Sans-Serif;margin:0 0 20px}.form-control{height:43px;padding:10px 15px;-webkit-box-shadow:inset 0 1px 1px rgba(0,0,0,.075);-webkit-transition:border-color ease-in-out .15s,box-shadow ease-in-out .15s}.message-template{margin:20px 0;padding:20px;border-left:5px solid #eee}.message-template-danger{background-color:#fdf7f7;border-color:#d9534f;border-right:1px solid #d9534f;border-top:1px solid #d9534f;border-bottom:1px solid #d9534f;border-radius:4px}.message-template-warning{background-color:#fcf8f2;border-color:#f0ad4e;border-right:1px solid #fcf8f2;border-top:1px solid #fcf8f2;border-bottom:1px solid #fcf8f2;border-radius:4px}.message-template-info{background-color:#f4f8fa;border-color:#5bc0de;border-right:1px solid #f4f8fa;border-top:1px solid #f4f8fa;border-bottom:1px solid #f4f8fa;border-radius:4px}.message-template-success{background-color:#F4FDF0;border-color:#3C763D;border-right:1px solid #F4FDF0;border-top:1px solid #F4FDF0;border-bottom:1px solid #F4FDF0;border-radius:4px}.message-template-default{background-color:#EEE;border-color:#B4B4B4;border-right:1px solid #EEE;border-top:1px solid #EEE;border-bottom:1px solid #EEE;border-radius:4px}.message-template-notice{background-color:#FCFCDD;border-color:#BDBD89;border-right:1px solid #FCFCDD;border-top:1px solid #FCFCDD;border-bottom:1px solid #FCFCDD;border-radius:4px}.dropdown-menu>li>a{display:block;padding:3px 20px;clear:both;font-weight:400;line-height:1.42857143;color:#7b8a8b;white-space:nowrap}.message-email-success{border-color:#BDBD89;border-right:1px solid #bdc3c7;border-top:1px solid #bdc3c7;border-bottom:1px solid #bdc3c7;border-radius:4px}.input-group{position:relative;display:table;border-collapse:separate}.panel-footer{padding:10px 15px;background-color:#ecf0f1;border-top:1px solid #ecf0f1;border-bottom-right-radius:3px;border-bottom-left-radius:3px}.input-sm{height:18px;padding:6px 9px;font-size:13px;line-height:1.5;border-radius:3px}.form-control:focus{border-color:#66afe9;outline:0;-webkit-box-shadow:inset 0 1px 1px rgba(0,0,0,.075),0 0 8px rgba(102,175,233,.6);box-shadow:inset 0 1px 1px rgba(0,0,0,.075),0 0 8px rgba(102,175,233,.6)}.btn{display:inline-block;cursor:pointer;padding:10px 15px;font-size:15px;line-height:1.42857143;border-radius:4px;-moz-user-select:none;-ms-user-select:none;user-select:none}.btn-danger{color:#fff;background-color:#e74c3c;border-color:#e74c3c}.input-group .form-control{position:relative;float:left;width:100%;margin-bottom:0}.input-group-btn{position:relative;font-size:0}.input-group-addon,.input-group-btn{width:1%;white-space:nowrap;vertical-align:middle}.input-group .form-control,.input-group-addon,.input-group-btn{display:table-cell}.input-group-btn>.btn{position:relative}.close{float:right;font-size:21px;font-weight:700;line-height:1;color:#000;text-shadow:0 1px 0 #fff;opacity:.2;filter:alpha(opacity=20)}.close:focus,.close:hover{color:#000;text-decoration:none;cursor:pointer;opacity:.5;filter:alpha(opacity=50)}button.close{padding:0;cursor:pointer;background:0 0;border:0;-webkit-appearance:none}.badge{display:inline-block;min-width:20px;padding:10px 14px;font-size:24px;font-weight:700;color:#fff;line-height:1;vertical-align:baseline;white-space:nowrap;text-align:center;background-color:#5bc0de;border-radius:10px}.panel-default{color:#333;background-color:#bdc3c7}.panel-heading{background-color:#f5f5f5}.col-md-4{width:352px}.row{margin-left:-15px;margin-right:-15px}.arrow:after{content:"";position:absolute;bottom:-25px;left:175px;border-style:solid;border-width:25px 25px 0;border-color:#FFF transparent;display:block;width:0;z-index:1}.arrow:before{content:"";position:absolute;left:296px;border-style:solid;border-width:17px 17px 0;border-color:#ddd transparent;display:block;width:0;z-index:0}*{box-sizing:border-box}body{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;font-size:14px;line-height:1.42857143;color:#333;background-color:#fff}.panel-default{border-color:#ddd}.panel{margin-bottom:20px;background-color:#fff;border:1px solid transparent;border-radius:4px;box-shadow:0 1px 1px rgba(0,0,0,.05)}.panel-default>.panel-heading{color:#333;background-color:#f5f5f5;border-color:#ddd}.panel-heading{padding:10px 15px;border-bottom:1px solid transparent;border-top-right-radius:3px;border-top-left-radius:3px}.panel-title{margin-top:0;margin-bottom:0;font-size:16px;color:inherit}.h3{font-family:inherit;font-weight:500;line-height:1.1}.panel-body{padding:15px}.form-control{display:block;width:100%;font-size:14px;line-height:1.42857143;color:#555;background-color:#fff;background-image:none;border:1px solid #ccc;border-radius:4px;box-shadow:inset 0 1px 1px rgba(0,0,0,.075);transition:border-color ease-in-out .15s,box-shadow ease-in-out .15s}.btn-block{display:block;width:100%;padding-left:0;padding-right:0}.btn-group-sm>.btn,.btn-sm{padding:5px 10px;font-size:12px;line-height:1.5;border-radius:3px}.btn-info{color:#fff;background-color:#5bc0de;border-color:#46b8da}.btn{margin-bottom:0;font-weight:400;text-align:center;vertical-align:middle;background-image:none;border:1px solid transparent;white-space:nowrap;-webkit-user-select:none}hr{margin-top:20px;margin-bottom:20px;border:0;border-top:1px solid #eee;box-sizing:content-box;height:0}.small,small{font-size:85%}';

  document.getElementsByTagName('head')[0].appendChild(style);

};


Feedback.prototype.show = function () {

  var id = self.fb_template_id;

  document.getElementById(id)
    .style.display = (document.getElementById(id)
      .style.display === 'none') ? 'block' : 'none';

};


Feedback.prototype.hide = function () {

  var id = self.fb_template_id;

  document.getElementById(id)
    .style.display = 'none';

};


Feedback.prototype.send = function () {

  var self = this;

  var data = {
    reply: document.getElementById('reply')
      .value
  };

  ajax({
    type: "POST",
    url: self.fb_post_url,
    data: data,
    dataType: 'json',

    success: function () {
      document.getElementById('msgsent')
        .style.display = 'block';

      document.getElementById('reply')
        .value = '';
    },

    error: function (err) {
      console.log("error", err);
    }
  });

};


/**
 * Expose `Feedback` instance.
 */

module.exports = bind.all(new Feedback());
