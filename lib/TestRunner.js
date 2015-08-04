'use strict';

var async = require('async')
  , log = require('fhlog').get('fh-health')
  , eventEmitter = require('./TestEvents')
  , STATUSES = require('./Statuses')
  , TestItem = require('./TestItem')
  , requestQueue = []
  , tests = []
  , isRunning = false
  , maxRuntime = (25 * 1000);

/**
 * Response from running test is JSON object with format:

    {
      "status": "<ok|warn|crit>",
      "summary": "<something-meaningful-about-the-status>",
      "details": []
    }
 */


/**
 * Initialise an fh-nodeapp with a health endpoint.
 * @param  {Object} app fh-nodeapp exports Object
 */
exports.init = function (app) {
  if(app) {
    app.health = function (params, callback) {
      exports.runTests(callback);
    };
  }
};


/**
 * Provide access to the exact fhlog instance this module is using.
 * This will allow users to configure it as per the fhlog docs.
 * @type {Object}
 */
exports.logger = log;


/**
 * Allows user to determine if tests are currently being executed.
 * @return {Boolean}
 */
exports.isRunning = function() {
  return isRunning;
};


/**
 * Add a test item.
 * This test item will return a WARN at worst if it fails.
 * @param {String}    desc
 * @param {Function}  testFn
 */
exports.addTest = function (desc, testFn) {
  tests.push(new TestItem(desc, testFn, false));
};


/**
 * Add a critical test item.
 * If this fails it's considered a critical issue.
 * @param {String} desc
 * @param {Function} testFn
 */
exports.addCriticalTest = function (desc, testFn) {
  tests.push(new TestItem(desc, testFn, true));
};


/**
 * Remove all tests that were added up until now.
 */
exports.clearTests = function () {
  tests = [];
};


/**
 * Configure a time after which tests can be considered timed out
 * @param {Number} time
 */
exports.setMaxRuntime = function (time) {
  maxRuntime = time;
};


/**
 * Executes all tests and provides results to the given callback.
 * @param {Function} callback
 */
exports.runTests = function (callback) {
  requestQueue.push(callback);

  // Cannot have concurrent health tests running
  if(isRunning) {
    log.w('Successive call to "runTests", adding to callback queue.');
    return;
  } else {
    log.i('Starting test cases.');
  }

  var timedOut = false,
    timerId = null,
    res = {
      'status': STATUSES.TYPES.OK,
      'summary': STATUSES.TEXT.OK,
      'details': []
    };

  // Set the isRunning flag
  isRunning = true;

  // Set a timeout to cancel the tests
  timerId = setTimeout(function() {
    log.w('Running tests timed out.');
    timedOut = true;
    isRunning = false;

    // All running test instance callbacks are instantly fired
    // thus ending the test run
    eventEmitter.emit(eventEmitter.EMITTED_EVENTS.TIMEOUT);
  }, maxRuntime);

  // Run the tests in parallel
  async.each(tests, function(testItem, cb) {
    testItem.run(function(err, time, testResult) {
      log.i('Test item "%s" finished running', testItem.getDescription());

      // Default to ok status
      var testStatus = STATUSES.TYPES.OK;

      if (err) {
        // Return error to response
        testResult = err;

        if(testItem.isCritical() === true) {
          log.e(
            'Test named "%s", critical test failure',
            testItem.getDescription()
          );
          // Critical test failed, status is critical
          res['status'] = STATUSES.TYPES.CRITICAL;
          res['summary'] = STATUSES.TEXT.CRITICAL;

          testStatus = STATUSES.TYPES.CRITICAL;
        } else if (res['status'] != STATUSES.TYPES.CRITICAL) {
          log.w(
            'Test named "%s" failed, not critical',
            testItem.getDescription()
          );
          // Normal test failed, status is warn but won't override critical
          testStatus = STATUSES.TYPES.WARN;

          // We don't want to overwrite a critical
          // overall status if one is set
          if (res['status'] != STATUSES.TYPES.CRITICAL) {
            res['status'] = STATUSES.TYPES.WARN;
            res['summary'] = STATUSES.TEXT.WARN;
          }
        }
      }

      // Update the response object
      res['details'].push({
        description: testItem.getDescription(),
        test_status: testStatus,
        result: testResult,
        runtime: time
      });

      cb();
    });
  }, function() {
    if(timedOut === true) {
      log.d('finished running all test cases after timeout.');
    }

    isRunning = false;
    clearTimeout(timerId);

    try {
      res = JSON.stringify(res, null, 1);
    } catch(e) {
      log.e('Failed to create test results JSON response:');
      log.e(e.toString());
      log.e(e.stack);

      res = 'Could not create JSON response. Check application error logs.';
    }

    // Clone and empty the request queue to allow new requests
    // to be served while sending responses to old requests
    var queue = requestQueue.splice(0, requestQueue.length);

    async.each(queue, function(reqCb, asyncCb) {
      reqCb(null, res);
      asyncCb(null, null);
    }, function() {
      log.i('responded to all requests');
    });
  });
};
