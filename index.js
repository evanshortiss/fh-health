/**
 * Adds in a 'cloud/health' endpoint to a nodeapp.
 *
 * Endpoint returns a JSON object with format:

    {
      "status": "<ok|warn|crit>",
      "summary": "<something-meaningful-about-the-status>",
      "details": []
    }
 */

module.exports = {
  init: init,
  runTests: runTests,
  addTest: addTest,
  addCriticalTest: addCriticalTest,
  clearTests: clearTests
};

var async = require('async');

var TEST_STATUSES = {
  TYPES: {
    OK: 'ok',
    WARN: 'warn',
    CRITICAL: 'crit'
  },
  SUMMARIES: {
    OK: 'No issues to report. All tests passed without error',
    WARN: 'Some non-critical tests encountered issues. See the "details" object for specifics.',
    CRITICAL: 'A critical test item enconutered an error. Please investigate this. See the "details" object for specifics.'
  }
}

// Hold test functions
var tests = [];


/**
 * Initialise the health component with a reference to main.js
 * @param {Object} app
 */
function init(app) {
  if(app) {
    app.health = function(params, callback) {
      runTests(callback);
    };
  }
}


/**
 * Removes all added tests
 */
function clearTests() {
  tests = [];
}


/**
 * Runs all tests provided in parallel
 * @param {Function} callback
 */
function runTests(callback) {
  var res = {
    'status': TEST_STATUSES.TYPES.OK,
    'summary': TEST_STATUSES.SUMMARIES.OK,
    'details': []
  };

  if(tests.length == 0) {
    return callback(null, res);
  }

  async.each(tests, function(testItem, cb) {
    testItem.fn(function(err, testResult) {
      var testStatus = TEST_STATUSES.TYPES.OK;

      if (typeof err != 'undefined' && err != null) {
        if (testItem.isCritical == true) {
          res['status'] = TEST_STATUSES.TYPES.CRITICAL;
          res['summary'] = TEST_STATUSES.SUMMARIES.CRITICAL;

          testStatus = TEST_STATUSES.TYPES.CRITICAL;
        } 
        // We don't want to overwrite a critical overall status if it's set
        else if(res['status'] != TEST_STATUSES.TYPES.CRITICAL) {
          res['status'] = TEST_STATUSES.TYPES.WARN;
          res['summary'] = TEST_STATUSES.SUMMARIES.WARN;

          testStatus = TEST_STATUSES.TYPES.WARN;
        }
      }

      res['details'].push({
        description: testItem.desc,
        test_status: testStatus,
        result: (typeof err != 'undefined' && err != null) ? err : testResult,
      });

      cb();
    });
  }, function() {
    // Return a JSON object formatted with single whitespaces
    return callback(null, JSON.stringify(res, null, 1));
  });
}


/**
 * Add a test function to our suite.
 * @param {Function}  testFn
 * @param {String}    desc
 * @param {Boolean}   isCritical
 */
function _addTest(testFn, desc, isCritical) {
  tests.push({
    isCritical: isCritical,
    desc: desc,
    fn: testFn,
  });
}


/**
 * Add a test that is non critical to the application.
 * @param {Function}  testFn
 * @param {String}    desc
 */
function addTest(desc, testFn) {
  _addTest(testFn, desc, false);
}


/**
 * Add a critical test function to the health endpoint.
 * If this test returns an err the app is status is set to 'crit'
 * @param {Function} testFn
 */
function addCriticalTest(desc, testFn) {
  _addTest(testFn, desc, true)
}