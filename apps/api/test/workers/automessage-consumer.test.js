describe('Worker automessageConsumer', function () {


  /**
   * npm dependencies
   */

  var moment = require('moment');
  var mongoose = require('mongoose');


  /**
   * Models
   */

  var AutoMessage = require('../../api/models/AutoMessage');
  var Conversation = require('../../api/models/Conversation');
  var Event = require('../../api/models/Event');


  /**
   * Workers
   */

  var worker = require('../../workers/automessage-consumer');


  /**
   * Iron mq Queue
   */

  var queue = worker._queue;


  /**
   * Test variables
   */

  var randomId = mongoose.Types.ObjectId;


  before(function (done) {
    setupTestDb(done);
  });

  describe('#amConsumer type:email', function () {

    var amId;

    before(function (cb) {
      amId = saved.automessages.first._id.toString();


      async.series([

        function clearQueue(cb) {
          queue()
            .clear(cb);
        },

        function postToQueue(cb) {
          // queue auto message
          queue()
            .post(amId, cb);
        },

        function clearEvents(cb) {
          Event.remove({}, cb);
        },

        function createEvent(cb) {
          var aid = saved.automessages.first.aid;
          var uid = saved.users.first._id;

          var newEvent = {
            aid: aid,
            uid: uid,
            type: 'track',
            name: 'Create Notification'
          };

          Event.create(newEvent, cb);
        }


      ], cb)

    });


    it('should fetch amId and send automessages', function (done) {

      worker._amConsumer(function (err, queueId, automessage) {

        expect(err)
          .to.not.exist;

        expect(queueId)
          .to.be.a("string")
          .that.is.not.empty;

        expect(automessage)
          .to.be.an("object")
          .that.is.not.empty;

        done();
      });

    });


    it('should create new automessage sent event', function (done) {

      var query = {
        type: 'auto',
        amId: amId.toString(),
        amState: 'sent'
      };

      Event
        .find(query)
        .exec(function (err, evn) {

          expect(err)
            .to.not.exist;

          expect(evn)
            .to.be.an('array')
            .that.has.length(1);

          done();
        });

    });



  });


  describe('#amConsumer type:notification', function () {

    var amId;

    before(function (done) {

      amId = saved.automessages.second._id.toString();


      async.series([

        function clearQueue(cb) {
          queue()
            .clear(cb);
        },

        function postToQueue(cb) {
          // queue auto message
          queue()
            .post(amId, cb);
        },

        function clearEvents(cb) {
          Event.remove({}, cb);
        },

        function automessageSentShouldBeZero(cb) {
          AutoMessage
            .findById(amId)
            .exec(function (err, amsg) {

              expect(amsg)
                .to.have.property('sent')
                .that.eqls(0);

              return cb(err);
            });
        },

        // create event to meet automessage segment
        function createEvent(cb) {
          var aid = saved.automessages.second.aid;
          var uid = saved.users.first._id;

          var newEvent = {
            aid: aid,
            uid: uid,
            type: 'track',
            name: 'Create Notification'
          };

          Event.create(newEvent, cb);
        }

      ], done);

    });

    it('should fetch amId and send automessages', function (done) {

      worker._amConsumer(function (err, queueId, automessage) {

        expect(err)
          .to.not.exist;

        expect(queueId)
          .to.be.a("string")
          .that.is.not.empty;

        expect(automessage)
          .to.be.an("object")
          .that.is.not.empty;

        done();
      });

    });


    it('should create new automessage sent event', function (done) {

      var query = {
        type: 'auto',
        amId: amId.toString(),
        amState: 'sent'
      };

      Event
        .find(query)
        .exec(function (err, evn) {

          expect(err)
            .to.not.exist;

          expect(evn)
            .to.be.an('array')
            .that.has.length(1);

          expect(evn[0])
            .to.have.property('amState')
            .that.eqls('sent');

          done();
        });

    });


    it('should increment automessage "sent" by 1', function (done) {

      AutoMessage
        .findById(amId)
        .exec(function (err, amsg) {

          expect(err)
            .to.not.exist;

          expect(amsg)
            .to.be.an('object')
            .that.has.property('sent')
            .that.eqls(1);

          done();
        });

    });


    it(
      'should create new notification conversation to be shown to the user',
      function (done) {

        Conversation
          .find({
            amId: amId,
            'messages.type': 'notification'
          })
          .exec(function (err, cons) {

            expect(err)
              .to.not.exist;

            expect(cons)
              .to.be.an("array")
              .that.has.length(1);

            expect(cons[0])
              .to.have.property('sub')
              .that.is.a('string')
              .and.is.not.empty;

            expect(cons[0])
              .to.have.property('messages')
              .that.is.an('array')
              .and.is.not.empty;

            expect(cons[0].messages[0])
              .to.have.property('type')
              .that.eqls('notification');

            expect(cons[0].amId.toString())
              .to.equal(amId.toString());

            expect(cons[0].messages[0])
              .to.have.property('body')
              .and.to.equal('Hey Prat, Welkom to Second CabanaLand!');

            done();
          });

      });

  });


  describe('#removeUsersAlreadySent', function () {

    var amsg, usr1, usr2;

    before(function (done) {

      amsg = saved.automessages.first;
      usr1 = saved.users.first;
      usr2 = saved.users.second;

      async.series(

        [

          function deleteAutoMessageEvents(cb) {
            Event.remove({}, cb);
          },

          function zeroEvents(cb) {
            Event.find({}, function (err, evns) {
              expect(err)
                .to.not.exist;

              expect(evns)
                .to.be.an('array')
                .that.is.empty;

              cb();
            })
          },

          function createAutoMessageEvent(cb) {

            Event.automessage(

              {
                aid: amsg.aid,
                amId: amsg._id,
                uid: usr1._id
              },

              'sent',
              'Create Notification',

              function (err, evn) {
                cb(err);
              });

          }

        ],

        done
      );

    });


    it(
      'should return uids of users who have already been sent the automessage',
      function (done) {
        var users = [usr1, usr2];

        worker._removeUsersAlreadySent(users, amsg._id,
          function (err, newUsers) {

            expect(err)
              .to.not.exist;

            expect(users)
              .to.be.an("array")
              .that.has.length(2);

            expect(newUsers)
              .to.be.an("array")
              .that.has.length(1);

            expect(newUsers[0])
              .to.have.property('_id')
              .that.equals(usr2._id)
              .that.not.equals(usr1._id);

            done();
          });

      });

  });


});
