'use strict';

var async = require('async')
  , logger = require('./logger.js').getLogger()
  , eventEmitter = require('./TestEvents')
  , STATUSES = require('./Statuses')
  , TestItem = require('./TestItem')
  , requestQueue = []
  , tests = []
  , silent = false
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

function log(str) {
  if(silent === false) {
    logger('info', str);
  }
}


exports.init = function (app) {
  if(app) {
    app.health = function (params, callback) {
      exports.runTests(callback);
    };
  }
};

exports.silent = function (quiet) {
  if(quiet) {
    silent = true;
  } else {
    silent = false;
  }
};

exports.logger = {
  enableLogColours: function (val) {
    logger.setColorizedLogs(val);
  },
  enableJsonOutput: function (val) {
    logger.enableJsonFormatedLogs(val);
  },
  setLogLevel: function (val) {
    logger.setLogLevel(val);
  }
};

exports.isRunning = function() {
  return isRunning;
};

exports.addTest = function (desc, testFn) {
  tests.push(new TestItem(desc, testFn, false));
};

exports.addCriticalTest = function (desc, testFn) {
  tests.push(new TestItem(desc, testFn, true));
};

exports.clearTests = function () {
  tests = [];
};

exports.setMaxRuntime = function (time) {
  maxRuntime = time;
};

exports.runTests = function (callback) {
  requestQueue.push(callback);

  // Cannot have concurrent health tests running
  if(isRunning) {
    return;
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
      var testStatus = STATUSES.TYPES.OK;

      if(err) {
        // Return error to response
        testResult = err;

        // Critical test failed, status is critical
        if(testItem.isCritical() === true) {
          res['status'] = STATUSES.TYPES.CRITICAL;
          res['summary'] = STATUSES.TEXT.CRITICAL;

          testStatus = STATUSES.TYPES.CRITICAL;
        }
        // Normal test failed, status is warn but won't override critical
        else if(res['status'] != STATUSES.TYPES.CRITICAL) {
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
      log('fh-health: finished running all test cases after timeout.');
    }

    isRunning = false;
    clearTimeout(timerId);

    try {
      res = JSON.stringify(res, null, 1);
    } catch(e) {
      res = 'Could not create JSON response. Test results contained a ' +
        ' circular reference.';
    }

    // Clone and empty the request queue to allow new requests
    // to be served while sending responses to old requests
    var queue = requestQueue.splice(0, requestQueue.length);

    async.each(queue, function(reqCb, asyncCb) {
      reqCb(null, res);
      asyncCb(null, null);
    }, function() {
      log('fh-health: Responded to requests');
    });
  });
};
