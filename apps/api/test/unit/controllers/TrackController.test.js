describe('Resource /track', function () {

  /**
   * npm dependencies
   */

  var mongoose = require('mongoose');
  var qs = require('qs');


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

    before(function (done) {
      logoutUser(done);
    });

    it('should return error if there is no app_id', function (done) {

      var url = '/track';

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

        var url = '/track?' +
          'app_id=' +
          appId;

        request
          .get(url)
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

        var user = JSON.stringify({});

        var url = '/track?' +
          'app_id=' +
          appId +
          '&user=' +
          user;

        request
          .get(url)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Please send user_id or email to identify user'
          })
          .end(done);

      });

    it('should create user if user does not exist', function (done) {

      var url = '/track?' +
        'app_id=' +
        appId +
        '&user=' +
        newUser;


      request
        .get(url)
        .expect('Content-Type', /json/)
        .expect(200)
        .end(done);

    });

    it('should return the uid, cid and sid', function (done) {

      var url = '/track?' +
        'app_id=' +
        appId +
        '&user=' +
        newUser;

      function hasIds(res) {
        var obj = res.body;
        if (!(obj.uid && obj.cid && obj.sid)) {
          return 'uid/cid/sid missing';
        }
      }

      request
        .get(url)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(hasIds)
        .end(done);

    });


    // it('should getOrCreate user if user cookie is not present',
    //   function (done) {

    //   });

    // it(
    //   'should getOrCreate company if company cookie is not present and company object is present',
    //   function (done) {

    //   });

    // it('should create new session if session cookie is not present',
    //   function (done) {

    //   });

    // it('should return error if no user object input',

    //   function (done) {

    //     request
    //       .get('/track?' + 'session=' + newSession)
    //       .expect('Content-Type', /json/)
    //       .expect(400)
    //       .expect({
    //         status: 400,
    //         error: 'Please call user.identify with user details'
    //       })
    //       .end(done);

    //   });

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
      'should return most recent queued notification, alongwith the theme color',
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
              .to.have.property("amId");

            expect(notf)
              .to.have.property("body");

            expect(notf)
              .to.have.property("ct");

            expect(notf)
              .to.have.property("seen");

            expect(notf)
              .to.have.property("sender");

            expect(notf)
              .to.have.property("uid");

            expect(notf)
              .to.have.property("color");


            done();
          });

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

    it('should create new conversation',
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


    it('should create new conversation with amId',
      function (done) {

        var email = saved.users.first.email;
        var testUrl = url;
        var newCon = {
          'app_id': appId,
          'email': saved.users.first.email,
          'body': 'Hey man, how are you?',
          'amId': saved.automessages.first._id
        };

        request
          .post(testUrl)
          .send(newCon)
          .expect('Content-Type', /json/)
          .expect(201)
          .end(function (err, res) {

            if (err) return done(err);

            var notf = res.body;

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

            expect(notf)
              .to.have.property("uid");

            expect(notf.amId)
              .to.eql(newCon.amId.toString());


            done();
          });

      });

  });


});
