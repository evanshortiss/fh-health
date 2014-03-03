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

module.exports = Health;

var STATUS_TYPES = {
  OK: 'ok',
  WARN: 'warn',
  CRIT: 'crit'
};

var STATUS_TEXT = {
  OK: 'No issues to report. All tests passed without error',
  WARN: 'Some non-critical tests encountered issues. See the "details" object for specifics.',
  CRITICAL: 'A critical test item enconutered an error. Please investigate this. See the "details" object for specifics.'
};


var async = require('async'),
  util = require('util'),
  events = require('events');


function Health() {
  // Store tests related to this instance
  this.tests = [];

  events.EventEmitter.call(this);
}
util.inherits(Health, events.EventEmitter);


/**
 * Initialise the health component with a reference to main.js
 * @param {Object} app
 */
Health.prototype.init = function(app) {
  if (app) {
    app.health = function(params, callback) {
      this.runTests(callback);
    };
  }
};


/**
 * Clear any added tests.
 */
Health.prototype.clearTests = function() {
  this.tests = [];
  this.emit('testsCleared');
};


/**
 * Runs all tests provided in parallel
 * @param {Function} callback
 */
Health.prototype.runTests = function(callback) {
  this.emit('testsStarted');

  var self = this;
  
  var res = {
    'status': STATUS_TYPES.OK,
    'summary': STATUS_TEXT.OK,
    'details': []
  };

  if (this.tests.length == 0) {
    return callback(null, res);
  }

  async.each(this.tests, function(testItem, cb) {
    testItem.fn(function(err, testResult) {
      // Default to ok status
      var testStatus = STATUS_TYPES.OK;

      if (err) {
        // Critical test failed, status is critical
        if (testItem.isCritical == true) {
          res['status'] = STATUS_TYPES.CRIT;
          res['summary'] = STATUS_TEXT.CRITICAL;

          testStatus = STATUS_TYPES.CRIT;
        }
        // Normal test failed, status is warn
        else {
          testStatus = STATUS_TYPES.WARN;

          // We don't want to overwrite a critical overall status if one is set
          if (res['status'] != STATUS_TYPES.CRIT) {
            res['status'] = STATUS_TYPES.WARN;
            res['summary'] = STATUS_TEXT.WARN;
          }
        }
      }

      // Update the response object
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
};


/**
 * Add a test function to our suite.
 * @param {Function}  testFn
 * @param {String}    desc
 * @param {Boolean}   isCritical
 */
Health.prototype._addTest = function(testFn, desc, isCritical) {
  this.tests.push({
    isCritical: isCritical,
    desc: desc,
    fn: testFn,
  });
};


/**
 * Add a test that is non critical to the application.
 * @param {Function}  testFn
 * @param {String}    desc
 */
Health.prototype.addTest = function(desc, testFn) {
  this._addTest(testFn, desc, false);
};


/**
 * Add a critical test function to the health endpoint.
 * If this test returns an err the app is status is set to 'crit'
 * @param {Function} testFn
 */
Health.prototype.addCriticalTest = function(desc, testFn) {
  this._addTest(testFn, desc, true)
};
