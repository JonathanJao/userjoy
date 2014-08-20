describe('Worker score-consumer', function () {


  /**
   * npm dependencies
   */

  var moment = require('moment');
  var mongoose = require('mongoose');


  /**
   * Models
   */

  var DailyReport = require('../../api/models/DailyReport');
  var User = require('../../api/models/User');


  /**
   * Fixtures
   */

  var DailyReportFixture = require('../fixtures/DailyReportFixture');


  /**
   * Workers
   */

  var worker = require('../../workers/score-consumer');


  /**
   * Iron mq Queue
   */

  var healthQueue = worker._healthQueue;
  var scoreQueue = worker._scoreQueue;


  /**
   * Test variables
   */

  var randomId = mongoose.Types.ObjectId;


  before(function (done) {
    setupTestDb(done)
  });


  var usr1, usr2, aid, uid1, uid2;

  before(function (done) {
    usr1 = saved.users.first;
    usr2 = saved.users.second;
    aid = usr1.aid.toString();
    uid1 = usr1._id;
    uid2 = usr2._id;

    DailyReportFixture(aid, [uid1, uid2], done);

  });


  describe('#mapReduce', function () {


    it('should return the engagement score for each uid', function (done) {

      var cid;

      var yesterday = moment.utc()
        .subtract('days', 1);

      worker._mapReduce(aid, cid, yesterday.format(),
        function (err, res, stats) {

          expect(err)
            .to.not.exist;

          expect(
            res)
            .to.be.an('array')
            .with.length(2);

          _.each(res, function (u) {
            expect(u)
              .to.be.an("object")
              .that.has.property("value")
              .that.is.a("number")
              .that.is.within(0, 100);
          });

          done();

        });


    });

  });


  describe('#scoreConsumerWorker', function () {


    it('should run mapReduce and save score', function (done) {


      var updateTime = moment.utc();
      var date = updateTime.date();

      async.series(

        [

          function clearScoreQueue(cb) {
            scoreQueue()
              .clear(cb);
          },

          function clearHealthQueue(cb) {
            healthQueue()
              .clear(cb);
          },

          function postToScoreQueue(cb) {
            scoreQueue()
              .post(

                JSON.stringify({
                  aid: aid,
                  updateTime: updateTime
                }),

                cb);
          },

          function checkBeforeReportScore(cb) {

            DailyReport
              .find({}, function (err, scoreBefore) {

                expect(err)
                  .to.not.exist;

                expect(scoreBefore)
                  .to.be.an("array")
                  .that.has.length(4);

                cb();
              });
          },

          function checkBeforeUserScore(cb) {

            User
              .findById(uid1, function (err, usr) {

                expect(err)
                  .to.not.exist;

                // 50 is the default score
                expect(usr.score)
                  .to.be.a("number")
                  .that.eqls(50);

                cb();
              });
          },


          function runScoreWorker(cb) {

            var cid;

            worker._scoreConsumerWorker(function (err) {

              expect(err)
                .to.not.exist;

              cb();
            })

          },


          function checkAfterReportScore(cb) {

            DailyReport.find({}, function (err, scoreAfter) {

              expect(err)
                .to.not.exist;

              expect(scoreAfter)
                .to.be.an("array")
                .that.has.length(4);


              _.each(scoreAfter, function (h) {

                h = h.toJSON();

                if (h.y === updateTime.year() && h.m === updateTime.month()) {

                  expect(h)
                    .to.be.an("object")
                    .that.has.property("du_" + date)
                    .that.is.a("number")
                    .that.is.within(0, 1440);

                  // since there are only two users, the score must be either
                  // 0 or 100
                  expect(_.contains([0, 100], h["ds_" + date]))
                    .to.be.true;

                }

              });

              cb();
            });
          },

          function checkAfterUserScore(cb) {

            User
              .findById(uid1, function (err, usr) {

                expect(err)
                  .to.not.exist;

                // 50 is the default score
                expect(usr.score)
                  .to.be.a("number")
                  .that.not.eqls(50);

                cb();
              });
          },

          // should have deleted message from score queue
          function checkScoreQueue(cb) {
            scoreQueue()
              .get({
                n: 1
              }, function (err, response) {

                expect(err)
                  .to.not.exist;

                expect(response)
                  .to.not.exist;

                cb(err);
              })
          },



          // should have added the aid to the health queue
          function checkHealthQueue(cb) {
            healthQueue()
              .get({
                n: 1
              }, function (err, response) {

                expect(err)
                  .to.not.exist;

                var appData = JSON.parse(response.body);

                expect(appData)
                  .to.have.property('aid')
                  .that.eqls(aid);

                cb(err);
              })


            // TODO: add test to check if queuedHealth was updated
          }

        ],

        done)


    });


  });


});
