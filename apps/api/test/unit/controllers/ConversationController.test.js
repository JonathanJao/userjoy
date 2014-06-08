describe('Resource /apps/:aid/conversations', function () {

  /**
   * npm dependencies
   */

  var mongoose = require('mongoose');


  /**
   * policies
   */

  var hasAccess = require('../../../api/policies/hasAccess');


  /**
   * models
   */

  var Conversation = require('../../../api/models/Conversation');


  /**
   * Test variables
   */

  var newConversation = {
    name: 'My New Conversation'
  };

  var randomId = mongoose.Types.ObjectId;
  var aid, basePath;


  before(function (done) {
    setupTestDb(function (err) {
      if (err) return done(err);
      aid = saved.apps.first._id;
      basePath = '/apps/' + aid + '/conversations';
      done();
    });
  });


  describe('PUT /apps/:aid/conversations/:coId/closed', function () {

    var parentConversationId;
    var testUrl;

    before(function (done) {
      parentConversationId = saved.conversations.first._id;
      testUrl = basePath + '/' + parentConversationId + '/closed';
      logoutUser(done);
    });


    it('should return error if not logged in',

      function (done) {

        request
          .put(testUrl)
          .send({})
          .expect('Content-Type', /json/)
          .expect(401)
          .expect({
            status: 401,
            error: 'Unauthorized'
          })
          .end(done);

      });


    it('logging in user',

      function (done) {
        loginUser(done);
      });

    it('should update conversation closed status to true',

      function (done) {

        request
          .put(testUrl)
          .set('cookie', loginCookie)
          .send(newConversation)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(function (res) {
            expect(res.body.closed)
              .to.be.true;
          })
          .end(done);

      });

  });


  describe('PUT /apps/:aid/conversations/:coId/reopened', function () {

    var parentConversationId;
    var testUrl;

    before(function (done) {
      parentConversationId = saved.conversations.first._id;
      testUrl = basePath + '/' + parentConversationId + '/reopened';
      logoutUser(done);
    });


    it('should return error if not logged in',

      function (done) {

        request
          .put(testUrl)
          .send({})
          .expect('Content-Type', /json/)
          .expect(401)
          .expect({
            status: 401,
            error: 'Unauthorized'
          })
          .end(done);

      });


    it('logging in user',

      function (done) {
        loginUser(done);
      });

    it('should update conversation closed status to false',

      function (done) {

        request
          .put(testUrl)
          .set('cookie', loginCookie)
          .send(newConversation)
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(function (res) {
            expect(res.body.closed)
              .to.be.false;
          })
          .end(done);

      });

  });


  describe('GET /apps/:aid/conversations', function () {


    before(function (done) {
      logoutUser(done);
    });


    it('should return error if not logged in',

      function (done) {

        request
          .get(basePath)
          .expect('Content-Type', /json/)
          .expect(401)
          .expect({
            status: 401,
            error: 'Unauthorized'
          })
          .end(done);

      });


    it('logging in user',

      function (done) {
        loginUser(done);
      });


    it('should return all open conversations belonging to app, and populate uid / assignee',

      function (done) {

        request
          .get(basePath)
          .set('cookie', loginCookie)
          .expect('Content-Type', /json/)
          .expect(function (res) {

            expect(res.body)
              .to.be.an("array")
              .that.is.not.empty;

            expect(res.body[0])
              .to.have.property('assignee')
              .that.is.an('object')
              .that.has.keys(['_id', 'name', 'email']);

            expect(res.body[0])
              .to.have.property('uid')
              .that.is.an('object')
              .that.has.keys(['_id', 'email']);

            _.each(res.body, function (m) {
              expect(m.closed)
                .to.be.false;
            });

          })
          .end(done);

      });


    it('should return all open conversations if "?filter=open"',

      function (done) {

        request
          .get(basePath + '?filter=open')
          .set('cookie', loginCookie)
          .expect('Content-Type', /json/)
          .expect(function (res) {
            expect(res.body)
              .to.be.an("array");

            expect(res.body)
              .to.not.be.empty;

            _.each(res.body, function (m) {
              expect(m.closed)
                .to.be.false;
            });

          })
          .end(done);

      });


    it('should return all unread conversations if "?filter=unread"',

      function (done) {

        request
          .get(basePath + '?filter=unread')
          .set('cookie', loginCookie)
          .expect('Content-Type', /json/)
          .expect(function (res) {
            expect(res.body)
              .to.be.an("array");

            expect(res.body)
              .to.not.be.empty;

            _.each(res.body, function (m) {
              expect(m.toRead)
                .to.be.true;
            });

          })
          .end(done);

      });



    it('should return all closed conversations if query "?filter=closed"',
      function (done) {

        request
          .get(basePath + '?filter=closed')
          .set('cookie', loginCookie)
          .expect('Content-Type', /json/)
          .expect(function (res) {
            expect(res.body)
              .to.be.an("array");

            expect(res.body)
              .to.not.be.empty;

            expect(res.body[0].closed)
              .to.be.true;
          })
          .end(done);

      });

  });


  describe('GET /apps/:aid/conversations/:coId', function () {

    var testCon;
    var testPath;

    before(function (done) {
      testCon = saved.conversations.first;
      testPath = basePath + '/' + testCon._id;
      logoutUser(done);
    });


    it('should return error if not logged in', function (done) {

      request
        .get(testPath)
        .expect('Content-Type', /json/)
        .expect(401)
        .expect({
          status: 401,
          error: 'Unauthorized'
        })
        .end(done);

    });


    it('logging in user',

      function (done) {
        loginUser(done);
      });


    it(
      'should return all messages belonging to conversation, and populate uid and assignee',

      // TODO: make sure atleast two messages are there in the thread

      function (done) {

        request
          .get(testPath)
          .set('cookie', loginCookie)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (err, res) {

            expect(res.body)
              .to.be.an("object");

            expect(res.body)
              .to.have.property('assignee')
              .that.is.an('object')
              .that.has.keys(['name', 'email', '_id']);

            expect(res.body)
              .to.have.property('uid')
              .that.is.an('object')
              .that.has.keys(['email', '_id']);

            expect(res.body)
              .to.have.property('messages')
              .to.be.an("array")
              .that.has.length.above(0);

            done();
          });

      });


    // this test depends on the output of the previous test, hence it should be
    // below
    it(
      'should update seen status to true for all messages in the thread, sent from user',
      function (done) {

        Conversation
          .findById(testCon._id)
          .exec(function (err, con) {

            var msgs = con.messages;

            if (err) return done(err);

            expect(msgs)
              .to.have.length.above(0);

            _.chain(msgs)
              .each(function (m) {
                if (m.from === 'user') {
                  expect(m.seen)
                    .to.be.true;
                }
              })
              .value();

            done();
          });

      });


    // this test depends on the output of a previous test, hence it should be
    // below
    // TODO: check if this test is right
    it('should update toRead status of conversation to false',
      function (done) {

        Conversation
          .findById(testCon._id)
          .exec(function (err, con) {

            expect(err)
              .to.not.exist;

            expect(con)
              .to.have.property("toRead", false);

            done();
          });

      });

  });


  describe('POST /apps/:aid/conversations', function () {


    before(function (done) {
      logoutUser(done);
    });


    it('should return error if not logged in',

      function (done) {

        request
          .post(basePath)
          .send({})
          .expect('Content-Type', /json/)
          .expect(401)
          .expect({
            status: 401,
            error: 'Unauthorized'
          })
          .end(done);

      });


    it('logging in user',

      function (done) {
        loginUser(done);
      });

    it('should return error if body/sub/type/uids is not provided',

      function (done) {

        var newMessage = {};
        // TODO: fix this test, and the validation method in the ConversationController
        request
          .post(basePath)
          .set('cookie', loginCookie)
          .send(newMessage)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Missing body/sub/type/uids'
          })
          .end(done);

      });

    it('should return error if message is not of email type',

      function (done) {

        var newMessage = {
          body: 'random body',
          sub: 'random sub',
          type: 'notification',
          uids: [randomId()]
        };

        request
          .post(basePath)
          .set('cookie', loginCookie)
          .send(newMessage)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Only emails can be sent through manual messages'
          })
          .end(done);

      });

    it('should create new conversation with message',

      function (done) {
        var uids = [saved.users.first._id];
        var newMessage = {
          body: 'This is the message I want to send to {{= user.email || "YOU" }}',
          sub: 'Welcome to UserJoy, {{= user.email || "you"}}',
          type: 'email',
          uids: uids,
        };

        request
          .post(basePath)
          .set('cookie', loginCookie)
          .send(newMessage)
          .expect('Content-Type', /json/)
          .expect(201)
          .expect(function (res) {

            var con = res.body[0];

            expect(con.sub)
              .to.eql('Welcome to UserJoy, prattbhatt@gmail.com');

            var messages = con.messages;

            expect(messages)
              .to.be.an("array");

            expect(messages)
              .to.have.length(1);

            expect(messages[0].body)
              .to.eql(
                'This is the message I want to send to prattbhatt@gmail.com'
            );

            expect(messages[0])
              .to.have.property('sName')
              .that.equals(saved.accounts.first.name);

          })
          .end(done);

      });

  });

  describe('POST /apps/:aid/conversations/:coId', function () {

    var savedCon;
    var testUrl;

    before(function (done) {
      savedCon = saved.conversations.first;
      testUrl = basePath + '/' + savedCon._id;
      logoutUser(done);
    });


    it('should return error if not logged in',

      function (done) {

        request
          .post(testUrl)
          .send({})
          .expect('Content-Type', /json/)
          .expect(401)
          .expect({
            status: 401,
            error: 'Unauthorized'
          })
          .end(done);

      });


    it('logging in user',

      function (done) {
        loginUser(done);
      });

    it('should return error if body is not provided',

      function (done) {

        var newMessage = {};
        // TODO: fix this test, and the validation method in the ConversationController
        request
          .post(testUrl)
          .set('cookie', loginCookie)
          .send(newMessage)
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Missing body'
          })
          .end(done);

      });

    it('should create new message reply',

      function (done) {

        var newMessage = {
          body: 'This is the message I want to reply'
        };


        expect(savedCon.messages)
          .to.have.length(1);


        request
          .post(testUrl)
          .set('cookie', loginCookie)
          .send(newMessage)
          .expect('Content-Type', /json/)
          .expect(201)
          .expect(function (res) {

            var con = res.body;

            expect(con.messages)
              .to.have.length(2);

            expect(con.messages[1].body)
              .to.eql(newMessage.body);

            expect(con.messages[1].from)
              .to.eql('account');

            expect(con.messages[1].sName)
              .to.exist;
          })
          .end(done);

      });

  });


  describe('PUT /apps/:aid/conversations/:coId/assign', function () {

    var savedCon;
    var testUrl;

    before(function (done) {
      savedCon = saved.conversations.first;
      testUrl = basePath + '/' + savedCon._id + '/assign';
      logoutUser(done);
    });


    it('should return error if not logged in', function (done) {

      request
        .put(testUrl)
        .send({})
        .expect('Content-Type', /json/)
        .expect(401)
        .expect({
          status: 401,
          error: 'Unauthorized'
        })
        .end(done);

    });


    it('logging in user', function (done) {
      loginUser(done);
    });

    it('should return error if assignee account id is not provided',
      function (done) {

        request
          .put(testUrl)
          .set('cookie', loginCookie)
          .send({})
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            status: 400,
            error: 'Provide valid account id (assignee)'
          })
          .end(done);

      });

    it('should assign conversation', function (done) {

      var assignee = saved.accounts.second._id;

      request
        .put(testUrl)
        .set('cookie', loginCookie)
        .send({
          assignee: assignee
        })
        .expect('Content-Type', /json/)
        .expect(201)
        .expect(function (res) {

          expect(res.body)
            .to.have.property('assignee')
            .that.is.an('object')
            .that.has.keys(['name', 'email', '_id'])
            .that.has.deep.property('_id', assignee.toString());

        })
        .end(done);

    });

  });

});
