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
  addTest: addTest,
  addCriticalTest: addCriticalTest
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
  app.health = runTests;
}


/**
 * Runs all tests provided in parallel
 * @param {Function} callback
 */
function runTests(callback) {
  var res = {
    'status': TEST_STATUSES.TYPES.OK,
    'summary': TEST_STATUSES.TYPES.OK,
    'details': []
  };

  async.each(tests, function(testItem, cb) {
    testItem.fn(function(err, res) {
      // Only run if status is not at critical, we don't want to overwrite critical status
      if (res['status'] != TEST_STATUSES.TYPES.CRITICAL && typeof err != 'undefined' && err != null) {
        if (testItem.isCritical == true) {
          res['status'] = TEST_STATUSES.TYPES.CRITICAL;
          res['summary'] = TEST_STATUSES.SUMMARIES.CRITICAL;
        } else {
          res['status'] = TEST_STATUSES.TYPES.WARN;
          res['summary'] = TEST_STATUSES.SUMMARIES.WARN;
        }
      }

      res['details'].push({
        description: testItem.desc,
        result: res,
        error: err
      });

      cb();
    });
  }, function() {
    return callback(null, res);
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