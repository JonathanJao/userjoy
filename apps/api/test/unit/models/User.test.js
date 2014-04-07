describe.only('Model User', function () {

  /**
   * Models
   */

  var User = require('../../../api/models/User');


  /**
   * Test variables
   */

  var randomId = '532d6bf862d673ba7131812a';
  var savedUser;


  describe('#create', function () {

    it('should create user', function (done) {

      var newUser = {
        email: 'savinay@dodatado.com'
      };

      User.getOrCreate(randomId, newUser, function (err, usr) {
        expect(err)
          .to.not.exist;
        expect(usr)
          .to.be.an('object');

        savedUser = usr;

        expect(usr.email)
          .to.eql(newUser.email);
        done();
      });

    });


    it('should add firstSessionAt timestamp to user', function () {
      expect(savedUser)
        .to.have.property('firstSessionAt');
    });


    it('should add updatedAt timestamp to user', function () {
      expect(savedUser)
        .to.have.property('updatedAt');
    });


    it('should add firstSessionAt timestamp to user', function () {
      expect(savedUser)
        .to.have.property('firstSessionAt');
    });

    it('should not add createdAt timestamp unless provided', function () {
      expect(savedUser)
        .not.to.have.property('createdAt');
    });

    it('should have totalSessions as 1 when the user is created',
      function () {
        expect(savedUser.totalSessions)
          .to.eql(1);
      });

  });


  describe('#getOrCreate', function () {

    var newUser = {
      email: 'prattbhatt@gmail.com'
    };

    before(function (done) {
      newUser.appId = randomId;
      User.create(newUser, done);
    });

    it('should return user if user exists', function (done) {
      User.getOrCreate(randomId, newUser, function (err, usr) {
        expect(err)
          .to.not.exist;
        expect(usr)
          .to.be.ok;
        expect(usr.email)
          .to.eql(newUser.email);
        done();
      });
    });

    it('should create user if user does not exist', function (done) {

      var newUser = {
        email: 'savinay@dodatado.com'
      };

      User.getOrCreate(randomId, newUser, function (err, usr) {
        expect(err)
          .to.not.exist;
        expect(usr)
          .to.be.an('object');

        savedUser = usr;

        expect(usr.email)
          .to.eql(newUser.email);
        done();
      });

    });

    it('should throw error if any argument is missing', function (done) {

      var testFunc = function () {
        User.getOrCreate({}, function () {});
      };

      expect(testFunc)
        .to.
      throw ('undefined is not a function');
      done();
    });

    it('should return error if user_id and email are missing from user',
      function (done) {

        var testUser = {
          name: 'PrateekDoDataDo'
        };

        User.getOrCreate(randomId, testUser, function (err, usr) {
          expect(err)
            .to.exist;
          expect(err.message)
            .to.eql('Please send user_id or email to identify user');
          done();
        });
      });
  });

});
