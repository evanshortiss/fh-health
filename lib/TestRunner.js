var async = require('async'),
  eventEmitter = require('./TestEvents'),
  STATUSES = require('./Statuses'),
  tests = [];

/**
 * Response from running test is JSON object with format:

    {
      "status": "<ok|warn|crit>",
      "summary": "<something-meaningful-about-the-status>",
      "details": []
    }
 */


var isRunning = false,
  maxRuntime = (25 * 1000),
  timeoutTimer = null;

var TestRunner = module.exports = {
  isRunning: function() {
    return isRunning;
  },

  addTest: function(test) {
    tests.push(test);
  },

  clearTests: function() {
    tests = [];
  },

  setMaxRuntime: function(time) {
    maxRuntime = time;
  },

  run: function(callback) {
    var timedOut = false,
      timerId = null,
      startTime = Date.now(),
      res = {
        'status': STATUSES.TYPES.OK,
        'summary': STATUSES.TEXT.OK,
        'details': []
      };

    // Set the isRunning flag
    isRunning = true;

    // Set a timeout to cancel the tests
    timerId = setTimeout(function() {
      timedOut = true;
      isRunning = false;

      // All running test instance callbacks are instantly fired
      // thus ending the test run 
      eventEmitter.emit(eventEmitter.EMITTED_EVENTS.TIMEOUT);
    }, maxRuntime);

    // Run the tests in parallel
    async.each(tests, function(testItem, cb) {
      testItem.run(function(err, time, testResult) {
        // Default to ok status
        var testStatus = STATUSES.TYPES.OK,
          testResult = (err === null) ? err : testResult;

        if (err) {
          // Critical test failed, status is critical
          if (testItem.isCritical() === true) {
            res['status'] = STATUSES.TYPES.CRITICAL;
            res['summary'] = STATUSES.TEXT.CRITICAL;

            testStatus = STATUSES.TYPES.CRITICAL;
          }
          // Normal test failed, status is warn but won't override critical
          else if(res['status'] != STATUSES.TYPES.CRITICAL) {
            testStatus = STATUSES.TYPES.WARN;

            // We don't want to overwrite a critical overall status if one is set
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
        });

        cb();
      });
    }, function() {
      if (timedOut === true) {
        console.warn(new Date().toJSON() + ' fh-health: finished running all test cases after timeout.');
      } else {
        clearTimeout(timerId);
        isRunning = false;
      }

      return callback(null, JSON.stringify(res, null, 1));
    });
  }
};