describe('Model User', function () {


  /**
   * npm dependencies
   */

  var moment = require('moment');
  var mongoose = require('mongoose');


  /**
   * Models
   */

  var User = require('../../../api/models/User');


  /**
   * Test variables
   */

  var randomId = mongoose.Types.ObjectId;


  before(function (done) {
    setupTestDb(done)
  });


  describe('#findOrCreate', function () {

    var existingUser;
    var savedUser;

    before(function () {
      existingUser = saved.users.first.toJSON();
    });

    var newUser = {
      email: 'prattbhatt@gmail.com'
    };

    // before(function (done) {
    //   newUser.aid = randomId();
    //   User.findOrCreate(newUser, done);
    // });


    it('should return error if user_id and email are missing from user',
      function (done) {

        var testUser = {
          name: 'PrateekDoDataDo'
        };

        User.findOrCreate(randomId(), testUser, function (err, usr) {
          expect(err)
            .to.exist;
          expect(err.message)
            .to.eql('NO_EMAIL_OR_USER_ID');
          done();
        });
      });


    it('should return user if user exists', function (done) {

      User.findOrCreate(existingUser.aid, existingUser, function (err,
        usr) {

        expect(err)
          .to.not.exist;

        expect(usr._id)
          .to.eql(existingUser._id);

        expect(usr.email)
          .to.eql(existingUser.email);

        done();
      });
    });

    it('should create user if user does not exist', function (done) {

      var id = randomId();

      var newUser = {
        email: id + '@dodatado.com',
        country: 'IN',
        ip: '115.118.149.224',
        joined: moment()
          .unix() * 1000,
        meta: {
          plan: 'Free Tier',
          amount: 40
        },
        plan: 'enterprise',
        revenue: 499,
        status: 'trial',
      };

      User.findOrCreate(id, newUser, function (err, usr) {

        expect(err)
          .to.not.exist;

        expect(usr.toJSON())
          .to.be.an('object')
          .and.to.have.property("meta")
          .that.is.an("array")
          .that.has.length(2)
          .that.deep.equals([{
            k: 'plan',
            v: 'Free Tier'
          }, {
            k: 'amount',
            v: 40
          }]);

        savedUser = usr;

        expect(usr.email)
          .to.eql(newUser.email);

        expect(usr.aid)
          .to.eql(id);

        expect(usr)
          .to.have.property("ip")
          .that.is.a("string")
          .that.equals(newUser.ip);

        expect(usr)
          .to.have.property("country")
          .that.is.a("string")
          .that.equals(newUser.country);

        expect(usr)
          .to.have.property("joined")
          .that.is.a("date");
        expect(moment(usr.joined)
          .startOf('day')
          .unix())
          .to.eql(moment(newUser.joined)
            .startOf('day')
            .unix());

        expect(usr)
          .to.have.property("plan")
          .that.is.a("string")
          .that.equals(newUser.plan);

        expect(usr)
          .to.have.property("revenue")
          .that.is.a("number")
          .that.equals(newUser.revenue);

        expect(usr)
          .to.have.property("status")
          .that.is.a("string")
          .that.equals(newUser.status);

        done();
      });

    });


    it('should add ct timestamp to user', function () {
      expect(savedUser)
        .to.have.property('ct');
    });


    it('should add ut timestamp to user', function () {
      expect(savedUser)
        .to.have.property('ut');
    });

    it('should not add ct timestamp', function () {
      expect(savedUser)
        .to.have.property('ct');
    });

    it('should have totalSessions as 1 when the user is created',
      function () {
        expect(savedUser.totalSessions)
          .to.eql(1);
      });


    it(
      'should return error if billing status is not in [trial, free, paying, cancelled]',
      function (done) {

        var aid = randomId();

        var testUser = {
          user_id: 'unique_user_id_here',
          status: 'randomStatus',
        };


        User.findOrCreate(aid, testUser, function (err, usr) {

          expect(err)
            .to.exist;

          expect(err.message)
            .to.eql(
              "Billing status must be one of 'trial', 'free', 'paying' or 'cancelled'"
          );

          done();
        });
      });


    it('should store company data if exists', function (done) {

      var aid = randomId();

      var testUser = {
        email: 'care@dodatado.com',
        companies: [{
          cid: randomId(),
          name: 'helloworld'
        }]
      };

      User.findOrCreate(aid, testUser, function (err, usr) {

        expect(err)
          .not.to.exist;

        expect(usr)
          .to.be.an('object');

        expect(usr.companies)
          .to.be.an('array');

        expect(usr.companies.length)
          .to.eql(1);

        expect(usr.companies[0].name)
          .to.eql('helloworld');
        done();
      });
    });


    it('should return error if company data doesnot have cid',
      function (done) {

        var aid = randomId();

        var testUser = {
          email: 'care@dodatado.com',
          companies: [{
            name: 'helloworld'
          }]
        };

        User.findOrCreate(aid, testUser, function (err, usr) {

          expect(err)
            .to.exist;

          expect(err.message)
            .to.eql('NO_COMPANY_ID');

          done();
        });
      });



  });

});
