describe('Resource /apps/:aid/automessages', function () {

  var randomId = '532d6bf862d673ba7131812a';
  var aid;
  var url;


  before(function (done) {
    setupTestDb(function (err) {
      aid = saved.apps.first._id;
      url = '/apps/' + aid + '/automessages';
      done(err);
    });
  });


  describe('POST /apps/:aid/automessages', function () {

    var savedMsg;

    var newAutoMsg = {};

    before(function (done) {
      logoutUser(done);
    });


    it('returns error if not logged in',

      function (done) {

        request
          .post(url)
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

    it('should return error if aid/body/creator/title/type is not present',
      function (done) {

        request
          .post(url)
          .set('cookie', loginCookie)
          .send({})
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({
            "error": [
              "type is required",
              "title is required",
              "creator is required",
              "body is required",
              "aid is required"
            ],
            "status": 400
          })
          .end(done);

      });


    it('should create new automessage',

      function (done) {

        var newAutoMsg = {
          aid: randomId,
          body: 'Hey, Welkom to CabanaLand!',
          creator: randomId,
          sub: 'Welkom!',
          title: 'Welcome Message',
          type: 'email'
        };

        request
          .post(url)
          .set('cookie', loginCookie)
          .send(newAutoMsg)
          .expect('Content-Type', /json/)
          .expect(201)
          .expect(function (res) {
            savedMsg = res.body;

            expect(savedMsg)
              .to.have.property("creator", newAutoMsg.creator);

            expect(savedMsg)
              .to.have.property("type", newAutoMsg.email);

            expect(savedMsg)
              .to.have.property("aid", newAutoMsg.aid.toString());

          })
          .end(done);

      });

  });


  describe('GET /apps/:aid/automessages', function () {


    before(function (done) {
      logoutUser(done);
    });


    it('returns error if not logged in',

      function (done) {

        request
          .get(url)
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


    it('fetches all automessages belonging to app',

      function (done) {

        request
          .get(url)
          .set('cookie', loginCookie)
          .expect('Content-Type', /json/)
          .expect(function (res) {

            expect(res.body)
              .to.be.an("array");

            expect(res.body)
              .to.not.be.empty;
          })
          .expect(200)
          .end(done);

      });

  });

  describe('GET /apps/:aid/automessages/:amId', function () {

    var savedAutoMessageId;
    var testUrl;

    before(function (done) {
      logoutUser(function (err) {
        savedAutoMessageId = saved.automessages.first._id;
        testUrl = url + '/' + savedAutoMessageId;
        done(err);
      });
    });


    it('returns error if not logged in',

      function (done) {

        request
          .get(testUrl)
          .expect('Content-Type', /json/)
          .expect(401)
          .end(done);
      });


    it('logging in user',

      function (done) {
        loginUser(done);
      });


    it('fetches automessage with given id',

      function (done) {

        request
          .get(testUrl)
          .set('cookie', loginCookie)
          .expect('Content-Type', /json/)
          .expect(function (res) {
            expect(res.body)
              .to.not.be.empty;

            expect(res.body.title)
              .to.eql('Welcome Message');
          })
          .expect(200)
          .end(done);

      });


    it('returns error if no app with id is present',

      function (done) {

        var randomId = '5303570d9c554e7356000017';

        request
          .get('/apps/' + randomId)
          .set('cookie', loginCookie)
          .expect('Content-Type', /json/)
          .expect(404)
          .expect({
            "error": "Not Found",
            "status": 404
          })
          .end(done);

      });


    it('returns error if user doesnt have access to app',

      function (done) {

        request
          .get('/apps/' + saved.apps.second._id)
          .set('cookie', loginCookie)
          .expect('Content-Type', /json/)
          .expect(403)
          .end(done);

      });
  });


});