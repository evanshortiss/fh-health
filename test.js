var assert = require('assert');
var health = require('./index.js');

health.init(module.exports);

/**
 * Timeout test
 */
function timeoutTest(callback) {
  setTimeout(function() {
    return callback(null, 'This test will time out so this message won\'t be seen');
  }, 30000);
}

/**
 * Fake test that always fails
 */
function failingTest(callback) {
  setTimeout(function() {
    return callback('This fake test that always fails by returning this string as an error!');
  }, 50);
}

/**
 * Fake test that always passes
 */
function passingTest(callback) {
  setTimeout(function() {
    return callback(null, 'This is a test which will always pass by returning this string to the result callback param.');
  }, 50);
}

describe('Test the fh-health module', function() {

  describe('Test init will add test to an exports object', function() {
    it('Should run tests', function(done) {
      var fake_nodeapp = {}
      health.init(fake_nodeapp);
      health.addTest('Run the fake test that always passes', passingTest);

      fake_nodeapp.health({}, function(err, res) {
        assert(!err);
        assert(res);
        done();
      });
    });
  });

  // Test the getSection function with valid input
  describe('Call module with no tests defiend', function() {
    before(function() {
      health.clearTests();
    });

    it('Should return an ok status', function(done) {
      health.runTests(function(err, res) {
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
  });

  describe('Call with a single non-critical test', function() {
    // Reset and add in a dummy test
    before(function() {
      health.clearTests();
      health.addTest('Run the fake test that always passes', passingTest);
    });

    // Clear all tests
    after(function() {
      health.clearTests();
    });

    it('Should return a status of "ok"', function(done) {
      health.runTests(function(err, res) {
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
  });


  describe('Call with a failing test', function() {
    // Reset and add in a dummy test
    before(function() {
      health.clearTests();
      health.addTest('This is a fake test that always passes', passingTest);
      health.addTest('This is a fake test that always fails', failingTest);
    });

    // Clear all tests
    after(function() {
      health.clearTests();
    });

    it('Should return "warn" status', function(done) {
      health.runTests(function(err, res) {
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
  });


  describe('Call with a failing critical test', function() {
    // Reset and add in a dummy test
    before(function() {
      health.clearTests();
      health.addTest('Run the fake test that always passes', passingTest);
      health.addCriticalTest('This is a fake test that always fails', failingTest);
    });

    // Clear all tests
    after(function() {
      health.clearTests();
    });

    it('Should return "crit" status', function(done) {
      health.runTests(function(err, res) {
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
  });

  describe('Call with a timing out test', function() {
    // Reset and add in a dummy test
    before(function() {
      health.clearTests();
      health.setMaxRuntime(100);
      health.addTest('Run the fake test times out.', timeoutTest);
      health.addTest('Run the fake test that always fails.', failingTest);
      health.addTest('Run the fake test that always passes.', passingTest);
    });

    it('Should return "warn" status', function(done) {
      health.runTests(function(err, res) {
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
  });

  describe('Call the runTest fn twice with different callbacks.', function() {
    before(function(){
      health.clearTests();
      health.setMaxRuntime(1000);
      health.addTest('Run the fake test that always passes.', passingTest);
    });

    it('Should pass and both callbacks receive the same result', function(done) {
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

      health.runTests(cb1);
      health.runTests(cb2);
    });
  });

});
