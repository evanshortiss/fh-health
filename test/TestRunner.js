var assert = require('assert')
  , TestRunner = require('../lib/TestRunner');



function timeoutTest(callback) {
  setTimeout(function() {
    return callback(null, 'This test will time out so this message won\'t be seen');
  }, 30000);
}

function failingTest(callback) {
  setTimeout(function() {
    return callback('This fake test that always fails by returning this string as an error!');
  }, 50);
}

function passingTest(callback) {
  setTimeout(function() {
    return callback(null, 'This is a test which will always pass by returning this string to the result callback param.');
  }, 50);
}

describe('TestRunner', function() {

  describe('#init', function () {
    it('Should bind a health function to an object', function () {
      var obj = {};
      TestRunner.init(obj);

      assert.equal(typeof obj.health, 'function');
    });

    it('Should not throw any error', function () {
      TestRunner.init();
    });
  });

  describe('#clearTests', function () {
    it('Should not cause an error', function () {
      TestRunner.clearTests();
    });
  });

  describe('#isRunning', function () {
    it('Should return false', function () {
      assert.equal(TestRunner.isRunning(), false);
    });

    it('Should return true', function (done) {
      console.log('OKOKOK', TestRunner.isRunning())
      TestRunner.runTests(done);
      assert.equal(TestRunner.isRunning(), false);
    });
  });

  describe('Test init will add test to an exports object', function() {
    it('Should run tests', function(done) {
      var fake_nodeapp = {}
      TestRunner.init(fake_nodeapp);
      TestRunner.addTest('Run the fake test that always passes', passingTest);

      fake_nodeapp.health({}, function(err, res) {
        assert(!err);
        assert(res);
        done();
      });
    });
  });

  // Test the getSection function with valid input
  describe('#runTests', function() {
    beforeEach(function () {
      TestRunner.clearTests();
    });

    it('Should return an ok status with no tests added', function(done) {
      TestRunner.clearTests();

      TestRunner.runTests(function(err, res) {
        assert(!err);
        assert(res);

        res = JSON.parse(res);

        assert(res.summary);
        assert(res.details);
        assert(res.status == 'ok');
        assert(res.details.length == 0);
        done();
      });
    });

    it('Should return a status of "ok" for a single test', function(done) {
      TestRunner.addTest('Run the fake test that always passes', passingTest);

      TestRunner.runTests(function(err, res) {
        assert(!err);
        assert(res);

        res = JSON.parse(res);

        assert(res.summary);
        assert(res.details);
        assert(res.status == 'ok');
        assert(res.details.length == 1);
        assert(typeof res.details[0].runtime === 'number');
        done();
      });
    });

    it('Should return "warn" status', function(done) {
      TestRunner.addTest('This is a fake test that always passes', passingTest);
      TestRunner.addTest('This is a fake test that always fails', failingTest);

      TestRunner.runTests(function(err, res) {
        assert(!err);
        assert(res);

        res = JSON.parse(res);

        assert(res.summary);
        assert(res.details);
        assert(res.status == 'warn');
        assert(res.details.length == 2);
        assert(typeof res.details[0].runtime === 'number');
        assert(typeof res.details[1].runtime === 'number');
        done();
      });
    });

    it('Should return "crit" status', function(done) {
      TestRunner.addTest('Run the fake test that always passes', passingTest);
      TestRunner.addCriticalTest('This is a fake test that always fails', failingTest);

      TestRunner.runTests(function(err, res) {
        assert(!err);
        assert(res);

        res = JSON.parse(res);

        assert(res.summary);
        assert(res.details);
        assert(res.status == 'crit');
        assert(res.details.length == 2);
        assert(typeof res.details[0].runtime === 'number');
        assert(typeof res.details[1].runtime === 'number');
        done();
      });
    });

    it('Should return "warn" status', function(done) {
      TestRunner.setMaxRuntime(100);
      TestRunner.addTest('Run the fake test times out.', timeoutTest);
      TestRunner.addTest('Run the fake test that always fails.', failingTest);
      TestRunner.addTest('Run the fake test that always passes.', passingTest);

      TestRunner.runTests(function(err, res) {
        assert(!err);
        assert(res);

        res = JSON.parse(res);

        assert(res.summary);
        assert(res.details);
        assert(res.status == 'warn');
        assert(res.details.length == 3);
        // The last test is the one that has timed out
        assert(res.details[res.details.length - 1].result == 'The test didn\'t complete before the alotted time frame.');

        done();
      });
    });

    it('Should pass and both callbacks receive the same result', function(done) {
      TestRunner.setMaxRuntime(1000);
      TestRunner.addTest('Run the fake test that always passes.', passingTest);

      var res1 = null,
        res2 = null,
        finished = false;

      function cb1(err, res) {
        assert(!err);
        res1 = res;

        if(finished === true) {
          done();
        } else {
          finished = true;
        }
      }

      function cb2(err, res) {
        assert(!err);
        res2 = res;

        if(finished === true) {
          done();
        } else {
          finished = true;
        }
      }

      TestRunner.runTests(cb1);
      TestRunner.runTests(cb2);
    });
  });
});
