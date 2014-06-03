describe('Helper get-mailer-locals', function () {

  var getMailerLocals = require('../../../helpers/get-mailer-locals');

  var toName = 'prateek';
  var toEmail = 'prattbhatt@gmail.com';

  before(function (done) {
    setupTestDb(done);
  });

  describe('#getLocals', function () {

    var sender;
    var locals;
    var savedAutoMsg;
    var savedManualMsg;

    beforeEach(function () {

      savedAutoMsg = saved.automessages.first.toJSON();

      savedManualMsg = saved.conversations.first.messages[0];
      savedManualMsg.aid = saved.conversations.first.aid;
      savedManualMsg.coId = saved.conversations.first._id;
      savedManualMsg.sub = saved.conversations.first.sub;

      // mongoose populate is run to populate the creator account
      sender = saved.accounts.second;
      savedAutoMsg.sender = sender;

    });


    it('should create locals object for automessage', function () {

      var locals = getMailerLocals('auto', savedAutoMsg, toName, toEmail);

      expect(locals)
        .to.have.property("fromEmail", savedAutoMsg.aid +
          '@mail.userjoy.co');

      expect(locals)
        .to.have.property("fromName", sender.name);

      expect(locals)
        .to.have.property("toName", toName);

      expect(locals)
        .to.have.property("toEmail", toEmail);

      expect(locals)
        .to.have.property("body", savedAutoMsg.body);

      expect(locals)
        .to.have.property("subject", savedAutoMsg.sub);

      expect(locals)
        .to.have.property("replyToEmail", savedAutoMsg.aid +
          '@mail.userjoy.co');

      expect(locals)
        .to.have.property("replyToName", 'Reply to ' + sender.name);

      expect(locals.metadata)
        .to.have.property("amId", savedAutoMsg._id);
    });


    it('should create locals object for manual message', function () {

      var locals = getMailerLocals('manual', savedManualMsg, toName,
        toEmail);

      var fromEmail = savedManualMsg.aid + '@mail.userjoy.co';

      var replyToEmail = savedManualMsg.aid + '+' + savedManualMsg.coId +
        '@mail.userjoy.co';

      expect(locals)
        .to.have.property("fromEmail", fromEmail);

      expect(locals)
        .to.have.property("fromName", savedManualMsg.sName);

      expect(locals)
        .to.have.property("toName", toName);

      expect(locals)
        .to.have.property("toEmail", toEmail);
      expect(locals)
        .to.have.property("body", savedManualMsg.body);

      expect(locals)
        .to.have.property("subject", savedManualMsg.sub);

      expect(locals)
        .to.have.property("replyToEmail", replyToEmail);

      expect(locals)
        .to.have.property("replyToName", 'Reply to ' + savedManualMsg.sName);

      expect(locals.metadata)
        .to.have.property("mId", savedManualMsg._id);
    });


  });
});
