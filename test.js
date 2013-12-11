var assert = require('assert');
var health = require('./index.js');
health.init(module.exports);


/**
 * Fake test that always fails
 */
function failingTest(callback) {
  return callback('This fake test that always fails by returning this string as an error!');
}

/**
 * Fake test that always passes
 */
function passingTest(callback) {
  return callback(null, 'This is a test which will always pass by returning this string to the result callback param.');
}

// Test the getSection function with valid input
describe('Call module with no tests defiend', function() {
  it('Should return an ok status', function(done) {
    health.runTests(function(err, res) {
      assert(!err);
      assert(res);
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
    health.init(module.exports);
    health.addTest('Run the fake test that always passes', passingTest);
  });

  // Clear all tests
  after(function() {
    health.init(module.exports);
  });

  it('Should return a status of "ok"', function(done) {
    health.runTests(function(err, res) {
      assert(!err);
      assert(res);
      assert(res.summary);
      assert(res.details);
      assert(res.status == 'ok');
      assert(res.details.length == 1);
      done();
    });
  });
});


describe('Call with a failing test', function() {
  // Reset and add in a dummy test
  before(function() {
    health.init(module.exports);
    health.addTest('This is a fake test that always passes', passingTest);
    health.addTest('This is a fake test that always fails', failingTest);
  });

  // Clear all tests
  after(function() {
    health.init(module.exports);
  });

  it('Should return "warn" status', function(done) {
    health.runTests(function(err, res) {
      assert(!err);
      assert(res);
      assert(res.summary);
      assert(res.details);
      assert(res.status == 'warn');
      assert(res.details.length == 2);
      done();
    });
  });
});


describe('Call with a failing critical test', function() {
  // Reset and add in a dummy test
  before(function() {
    health.init(module.exports);
    health.addTest('Run the fake test that always passes', passingTest);
    health.addCriticalTest('This is a fake test that always fails', failingTest);
  });

  // Clear all tests
  after(function() {
    health.init(module.exports);
  });

  it('Should return "crit" status', function(done) {
    health.runTests(function(err, res) {
      assert(!err);
      assert(res);
      assert(res.summary);
      assert(res.details);
      assert(res.status == 'crit');
      assert(res.details.length == 2);
      done();
    });
  });
});