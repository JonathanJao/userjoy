describe('Resource /track', function () {

  /**
   * npm dependencies
   */

  var mongoose = require('mongoose');
  var qs = require('qs');


  /**
   * models
   */

  var AutoMessage = require('../../../api/models/AutoMessage');
  var Conversation = require('../../../api/models/Conversation');
  var Event = require('../../../api/models/Event');


  var TrackController = require('../../../api/routes/TrackController');

  // define test variables
  var newSession = {
    'hello': 'world'
  };


  var randomId = mongoose.Types.ObjectId;
  var appId;


  before(function (done) {
    setupTestDb(function (err) {
      appId = saved.apps.first._id.toString();
      newSession = JSON.stringify(newSession);
      done(err);
    });
  });

  describe('GET /track', function () {

    var url, appId, uid;

    before(function (done) {
      logoutUser(done);
    });

    beforeEach(function () {
      appId = saved.users.first.aid.toString();
      uid = saved.users.first._id.toString();
      url = '/track';
    });

    it('should return error if there is no app_id', function (done) {

      request
        .get(url)
        .expect('Content-Type', /json/)
        .expect(400)
        .expect({
          status: 400,
          error: 'Please send app_id with the params'
        })
        .end(done);
    });

    it('should return error if there is no uid (u)', function (done) {

      var q = qs.stringify({
        app_id: appId
      });

      var testUrl = url + '?' + q;

      request
        .get(testUrl)
        .expect('Content-Type', /json/)
        .expect(400)
        .expect({
          status: 400,
          error: 'Please send uid with the params'
        })
        .end(done);
    });

    // it('should return error if there is no user object',
    //   function (done) {

    //     var q = qs.stringify({
    //       app_id: appId
    //     });

    //     var testUrl = url + '?' + q;

    //     request
    //       .get(testUrl)
    //       .expect('Content-Type', /json/)
    //       .expect(400)
    //       .expect({
    //         status: 400,
    //         error: 'Please send user_id or email to identify user'
    //       })
    //       .end(done);

    //   });

    it('should create page event and return the aid, uid, cid',
      function (done) {

        var q = qs.stringify({
          app_id: appId,
          u: uid,
          e: {
            type: 'page',
            name: '/account/login'
          }
        });

        var testUrl = url + '?' + q;

        request
          .get(testUrl)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);

            expect(res.body)
              .to.have.property('aid');

            // FIXME check for cid as well
            // expect(res.body).to.have.property('cid');

            expect(res.body)
              .to.have.property('uid');


            expect(res.body)
              .to.have.property('eid');

            done();
          });

      });

    it('should create track event and return the aid, uid',
      function (done) {

        var q = qs.stringify({
          app_id: appId,
          u: uid,
          e: {
            type: 'track',
            name: 'Created notification'
          }
        });

        var testUrl = url + '?' + q;

        request
          .get(testUrl)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);

            expect(res.body)
              .to.have.property('aid', appId);

            // FIXME check for cid as well
            // expect(res.body).to.have.property('cid');

            expect(res.body)
              .to.have.property('uid', uid);


            expect(res.body)
              .to.have.property('eid')
              .that.is.not.empty;

            done();
          });

      });

    it('should return error if event type is not page / track',

      function (done) {

        var q = qs.stringify({
          app_id: appId,
          u: uid,
          e: {
            type: 'pageview',
            path: '/account/login'
          }
        });

        var testUrl = url + '?' + q;

        request
          .get(testUrl)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Event type is not supported'
          })
          .end(done);

      });

  });


  describe('GET /track/identify', function () {

    var url;

    before(function (done) {
      logoutUser(done);
    });

    beforeEach(function () {
      url = '/track/identify';
    });

    it('should return error if there is no app_id', function (done) {

      request
        .get(url)
        .expect('Content-Type', /json/)
        .expect(400)
        .expect({
          status: 400,
          error: 'Please send app_id with the params'
        })
        .end(done);
    });

    it('should return error if there is no user object',
      function (done) {

        var query = qs.stringify({
          app_id: appId
        });

        var testUrl = url + '?' + query;

        request
          .get(testUrl)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Please send user_id or email to identify user'
          })
          .end(done);

      });

    it('should return error if user_id and email are missing',
      function (done) {

        var query = qs.stringify({
          app_id: appId,
          user: {
            name: 'Prate'
          }
        });

        var testUrl = url + '?' + query;

        request
          .get(testUrl)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Please send user_id or email to identify user'
          })
          .end(done);

      });

    it('should create user if user does not exist', function (done) {

      var query = qs.stringify({
        app_id: appId.toString(),
        user: {
          email: 'randomUserTrackController@example.com'
        }
      });

      var testUrl = url + '?' + query;

      request
        .get(testUrl)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);

          expect(res.body)
            .to.have.property("aid");

          expect(res.body)
            .to.have.property("uid");

          done();
        });

    });


    it('should return aid / uid id user exists', function (done) {

      var existingUser = saved.users.first.toJSON();

      var query = qs.stringify({
        app_id: appId.toString(),
        user: {
          email: existingUser.email
        }
      });

      var testUrl = url + '?' + query;

      request
        .get(testUrl)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);

          expect(res.body)
            .to.have.property("aid", existingUser.aid.toString());

          expect(res.body)
            .to.have.property("uid", existingUser._id.toString());

          done();
        });
    });

  });


  describe('GET /track/company', function () {

    var url;
    var uid;

    before(function (done) {
      logoutUser(done);
    });

    beforeEach(function () {
      url = '/track/company';
      uid = saved.users.first._id.toString();
    });

    it('should return error if there is no app_id', function (done) {

      request
        .get(url)
        .expect('Content-Type', /json/)
        .expect(400)
        .expect({
          status: 400,
          error: 'Please send app_id with the params'
        })
        .end(done);
    });


    it('should return error if there is no uid',
      function (done) {

        var query = qs.stringify({
          app_id: appId
        });

        var testUrl = url + '?' + query;

        request
          .get(testUrl)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Please send uid with the params'
          })
          .end(done);

      });


    it('should return error if there is no company object',
      function (done) {

        var query = qs.stringify({
          app_id: appId,
          u: uid
        });

        var testUrl = url + '?' + query;

        request
          .get(testUrl)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Please send company_id to identify company'
          })
          .end(done);

      });

    it('should return error if company_id are missing',
      function (done) {

        var query = qs.stringify({
          app_id: appId,
          u: uid,
          company: {
            name: 'Prate'
          }
        });

        var testUrl = url + '?' + query;

        request
          .get(testUrl)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Please send company_id to identify company'
          })
          .end(done);

      });


    it(
      'should return error if company name not provided and company does not exist',
      function (done) {

        var query = qs.stringify({
          app_id: appId.toString(),
          u: uid,
          company: {
            company_id: 'randomUserTrackController@example.com'
          }
        });

        var testUrl = url + '?' + query;

        request
          .get(testUrl)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            error: 'Please send company name',
            status: 400
          })
          .end(done);

      });

    it('should create company if company does not exist', function (done) {

      var query = qs.stringify({
        app_id: appId.toString(),
        u: uid,
        company: {
          company_id: 'randomUserTrackController@example.com',
          name: 'WOWCOMPANY'
        }
      });

      var testUrl = url + '?' + query;

      request
        .get(testUrl)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);

          expect(res.body)
            .to.have.property("aid");

          expect(res.body)
            .to.have.property("cid");

          done();
        });

    });


    it('should return aid / cid id company exists', function (done) {

      var existingCom = saved.companies.first.toJSON();

      var query = qs.stringify({
        app_id: appId.toString(),
        u: uid,
        company: {
          company_id: existingCom.company_id,
          name: 'NEWCOMPANYONCE AGAIN'
        }
      });

      var testUrl = url + '?' + query;

      request
        .get(testUrl)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);

          expect(res.body)
            .to.have.property("aid", existingCom.aid.toString());

          expect(res.body)
            .to.have.property("cid", existingCom._id.toString());

          done();
        });
    });

  });



  describe('GET /track/notifications', function () {

    var url = '/track/notifications';

    before(function (done) {
      logoutUser(done);
    });

    it('should return error if there is no app_id', function (done) {

      request
        .get(url)
        .expect('Content-Type', /json/)
        .expect(400)
        .expect({
          status: 400,
          error: 'Please send app_id with the params'
        })
        .end(done);
    });

    it('should return error if there is no user_id or email',
      function (done) {

        var testUrl = url + '?app_id=' + appId;

        request
          .get(testUrl)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Please send user_id or email to identify user'
          })
          .end(done);

      });

    it('should return error if invalid app_id',
      function (done) {
        var testUrl = url + '?app_id=' + "randomappId" + '&email=' +
          saved.users.first.email;

        request
          .get(testUrl)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Provide valid app id'
          })
          .end(done);

      });

    it('should return error if app not found',
      function (done) {
        var testUrl = url + '?app_id=' + "test_randomappId" + '&email=' +
          saved.users.first.email;

        request
          .get(testUrl)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Provide valid app id'
          })
          .end(done);

      });

    it(
      'should return most recent queued notification, alongwith the theme color and showMessageBox status, and should create new automessage seen event, and increment seen count',
      function (done) {

        var email = saved.users.first.email;
        var testUrl = url + '?app_id=' + appId + '&email=' + email;
        var currentNotf;


        async.waterfall(

          [

            function makeRequest(cb) {

              request
                .get(testUrl)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {

                  if (err) return done(err);

                  var notf = res.body;
                  currentNotf = notf;

                  expect(notf)
                    .to.be.an('object');

                  expect(notf)
                    .to.have.property("amId");

                  expect(notf)
                    .to.have.property("body");

                  expect(notf)
                    .to.have.property("coId")
                    .that.is.ok;

                  expect(notf)
                    .to.have.property("ct");

                  expect(notf)
                    .to.have.property("senderEmail");

                  expect(notf)
                    .to.have.property("senderName");

                  expect(notf)
                    .to.have.property("uid");

                  expect(notf)
                    .to.have.property("color");

                  expect(notf)
                    .to.have.property("showMessageBox")
                    .that.is.a('boolean');

                  cb(err, notf);
                });
            },


            function automessageSeenEvent(notf, cb) {

              Event.findOne({
                aid: appId,
                amId: notf.amId,
                amState: 'seen'
              }, function (err, evn) {

                expect(err)
                  .to.not.exist;

                expect(evn.amId.toString())
                  .to.eql(notf.amId.toString());

                cb(err, notf);
              });

            },


            function automessageSeenCount(notf, cb) {

              AutoMessage
                .findById(notf.amId)
                .exec(function (err, amsg) {
                  expect(err)
                    .to.not.exist;

                  expect(amsg.seen)
                    .to.eql(1);

                  cb(err);
                });

            },

            function updatedSeenStatus(cb) {

              Conversation
                .find({
                  'aid': appId,
                  'amId': currentNotf.amId,
                  uid: currentNotf.uid,
                  'messages.type': 'notification'
                })
                .sort('-ct')
                .limit(1)
                .exec(function (err, conv) {

                  expect(conv)
                    .to.be.an('array')
                    .that.is.not.empty;

                  expect(conv[0].messages)
                    .to.be.an('array')
                    .that.has.length(1);

                  expect(conv[0].messages[0])
                    .to.have.property('seen')
                    .that.is.true;

                  cb();
                })

            }

          ],

          done


        );

      });

    it('should return the theme color if no new notification',
      function (done) {

        var email = saved.users.first.email;
        var testUrl = url + '?app_id=' + appId + '&email=' + email;

        request
          .get(testUrl)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (err, res) {
            if (err) return done(err);

            var notf = res.body;

            expect(notf)
              .to.be.an('object');

            expect(notf)
              .to.not.have.property("amId");

            expect(notf)
              .to.not.have.property("body");

            expect(notf)
              .to.not.have.property("ct");

            expect(notf)
              .to.not.have.property("seen");

            expect(notf)
              .to.not.have.property("sender");

            expect(notf)
              .to.not.have.property("uid");

            expect(notf)
              .to.have.property("color");


            done();
          });

      });


  });


  describe('POST /track/conversations', function () {

    var url = '/track/conversations';
    var appId;

    before(function (done) {
      appId = saved.apps.first._id;
      logoutUser(done);
    });

    it('should return error if there is no app_id', function (done) {

      request
        .post(url)
        .expect('Content-Type', /json/)
        .expect(400)
        .expect({
          status: 400,
          error: 'Please send app_id with the params'
        })
        .end(done);
    });

    it('should return error if there is no user_id or email',
      function (done) {

        var testUrl = url;
        var newCon = {
          'app_id': appId
        };

        request
          .post(testUrl)
          .send(newCon)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Please send user_id or email to identify user'
          })
          .end(done);

      });

    it('should return error if there is no body',
      function (done) {

        var testUrl = url;
        var newCon = {
          'app_id': appId,
          'email': saved.users.first.email
        };

        request
          .post(testUrl)
          .send(newCon)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Please write a message'
          })
          .end(done);

      });

    it('should return error if invalid app_id',
      function (done) {
        var testUrl = url;

        var newCon = {
          'app_id': 'randomappId',
          'email': saved.users.first.email,
          'body': 'Hey man, how are you?'
        };

        request
          .post(testUrl)
          .send(newCon)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Provide valid app id'
          })
          .end(done);

      });

    it('should return error if app not found',
      function (done) {
        var testUrl = url;

        var newCon = {
          'app_id': 'test_randomappId',
          'email': saved.users.first.email,
          'body': 'Hey man, how are you?'
        };

        request
          .post(testUrl)
          .send(newCon)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Provide valid app id'
          })
          .end(done);

      });


    it('should return error if user not found',
      function (done) {
        var testUrl = url;

        var newCon = {
          'app_id': saved.users.first.aid,
          'email': 'randomEmail',
          'body': 'Hey man, how are you?'
        };

        request
          .post(testUrl)
          .send(newCon)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'User not found'
          })
          .end(done);

      });


    it('should create new conversation (message sent from message-box)',
      function (done) {

        var email = saved.users.first.email;
        var testUrl = url;
        var newCon = {
          'app_id': appId,
          'email': saved.users.first.email,
          'body': 'Hey man, how are you?'
        };

        request
          .post(testUrl)
          .send(newCon)
          .expect('Content-Type', /json/)
          .expect(201)
          .end(function (err, res) {

            if (err) return done(err);

            var notf = res.body;

            expect(notf.assignee)
              .to.not.exist;

            expect(notf)
              .to.be.an('object');

            var savedMsg = notf.messages[0];

            expect(savedMsg)
              .to.have.property("body", newCon.body);

            expect(savedMsg)
              .to.have.property("ct");

            expect(savedMsg)
              .to.have.property("seen");

            expect(savedMsg)
              .to.have.property("sName");

            expect(notf)
              .to.have.property("uid");

            // it should not have amId
            expect(notf)
              .to.not.have.property("amId");

            done();
          });

      });

  });


  describe('POST /track/notifications/reply', function () {

    var url = '/track/notifications/reply';
    var appId;

    before(function (done) {
      appId = saved.apps.first._id;
      logoutUser(done);
    });

    it('should return error if there is no body',
      function (done) {

        var testUrl = url;
        var newCon = {
          'app_id': appId,
          'email': saved.users.first.email
        };

        request
          .post(testUrl)
          .send(newCon)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Please write a message'
          })
          .end(done);

      });

    it('should return error if there is no coId (conversation id)',
      function (done) {

        var testUrl = url;
        var newCon = {
          'app_id': appId,
          body: 'testing body'
        };

        request
          .post(testUrl)
          .send(newCon)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Please send conversation id with the params'
          })
          .end(done);

      });

    it(
      'should create a new reply to conversation with amId, create automessage replied event, increment replied count',
      function (done) {

        var email = saved.users.first.email;
        var testUrl = url;
        var con = saved.conversations.second;
        var coId = con._id;
        var newCon = {
          'app_id': appId,
          'body': 'Hey man, how are you?',
          'coId': coId
        };


        var noOfMessagesBefore;

        async.waterfall(

          [

            function beforeCheck(cb) {

              Conversation
                .findById(coId)
                .exec(function (err, conv) {
                  noOfMessagesBefore = conv.messages.length;
                  cb()
                });

            },

            function makeRequest(cb) {
              request
                .post(testUrl)
                .send(newCon)
                .expect('Content-Type', /json/)
                .expect(201)
                .end(function (err, res) {

                  if (err) return done(err);

                  var notf = res.body;

                  expect(notf)
                    .to.be.an('object')
                    .and.not.be.empty;

                  expect(notf.assignee.toString())
                    .to.eql(con.assignee.toString());

                  // last message
                  var savedMsg = notf.messages[noOfMessagesBefore];

                  expect(savedMsg)
                    .to.have.property("body", newCon.body);

                  expect(savedMsg)
                    .to.have.property("ct");

                  expect(savedMsg)
                    .to.have.property("seen");

                  expect(savedMsg)
                    .to.have.property("sName");

                  expect(notf)
                    .to.have.property("uid");

                  expect(notf)
                    .to.have.property("uid");

                  expect(notf)
                    .to.have.property('amId');


                  cb(null, notf);
                });

            },


            function automessageRepliedEvent(notf, cb) {

              Event.findOne({
                aid: appId,
                amId: notf.amId,
                amState: 'replied'
              }, function (err, evn) {

                expect(err)
                  .to.not.exist;

                expect(evn.amId.toString())
                  .to.eql(notf.amId.toString());

                cb(err, notf);
              });

            },


            function automessageRepliedCount(notf, cb) {

              AutoMessage
                .findById(notf.amId)
                .exec(function (err, amsg) {
                  expect(err)
                    .to.not.exist;

                  expect(amsg.replied)
                    .to.eql(1);

                  cb(err);
                });

            },


            function afterCheck(cb) {

              Conversation
                .findById(coId)
                .exec(function (err, conv) {

                  expect(conv)
                    .to.be.an('object')
                    .and.to.have.property('messages')
                    .that.is.an('array')
                    .and.has.length(noOfMessagesBefore + 1);

                  cb();
                });

            }

          ],

          done

        );


      });

  });


});
