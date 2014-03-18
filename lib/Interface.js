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

var testRunner = require('./TestRunner'),
  TestItem = require('./TestItem');


/**
 * Initialise the health component with a reference to main.js
 * @param {Object} app
 */
exports.init = function(app) {
  if (app) {
    app.health = function(params, callback) {
      exports.runTests(callback);
    };
  }
};


/**
 * Clear any added tests.
 */
exports.clearTests = testRunner.clearTests;


/**
 * Runs all tests provided in parallel
 * @param {Function}
 */
exports.runTests = testRunner.run;


/**
 * Set the max running time for a test case
 * @param {Number}
 */
exports.setMaxRuntime = testRunner.setMaxRuntime;


/**
 * Add a test that is non critical to the application.
 * @param {Function}  testFn
 * @param {String}    desc
 */
exports.addTest = function(desc, testFn) {
  testRunner.addTest(new TestItem(desc, testFn, false));
};


/**
 * Add a critical test function to the health endpoint.
 * If this test returns an err the app is status is set to 'crit'
 * @param {Function} testFn
 */
exports.addCriticalTest = function(desc, testFn) {
  testRunner.addTest(new TestItem(desc, testFn, true));
};
