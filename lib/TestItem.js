'use strict';

var eventEmitter = require('./TestEvents')
  , log = require('fhlog').get('fh-health')
  , TIMEOUT_MSG = 'The test didn\'t complete before the alotted time frame.';

/**
 * @constructor
 * @param {String}    desc
 * @param {Function}  testFn
 * @param {Boolean}   critical
 */
function TestItem(desc, testFn, critical) {
  this.testFn = testFn;
  this.desc = desc;

  // Is the test currently in progress
  this.isInProgress = false;
  // Is this test critical?
  this.critical = critical || false;
}

// Publically expose TestItem constructor
module.exports = TestItem;

TestItem.prototype.getDescription = function() {
  return this.desc;
};

TestItem.prototype.isCritical = function() {
  return this.critical;
};

TestItem.prototype.getTestFn = function() {
  return this.testFn;
};

/**
 * Start running the test case.
 * @param {Function}  callback(err, time, testResult)
 */
TestItem.prototype.run = function (callback) {
  if(this.isInProgress) {
    log.i('Called run method for "%s" while it was already in progress. ' +
      'Won\'t run again until first run is complete');
  } else {
    var self = this,
      startTime = Date.now(),
      timedOut = false;

    log.i('Start test "%s"', this.getDescription());

    this.isInProgress = true;

    // Need to create this function within run to ensure it's
    // a unique addition to the event emitter array so it can be
    // removed
    var listener = function() {
      timedOut = true;
      self.isInProgress = false;
      return callback(TIMEOUT_MSG, Date.now() - startTime, TIMEOUT_MSG);
    };

    // Register a handler to end this test if necessary
    eventEmitter.once(eventEmitter.EMITTED_EVENTS.TIMEOUT, listener);

    // Run the test function with a conditional callback
    this.getTestFn()(function(err, res) {
      // Remove the listener as the test has completed
      eventEmitter.removeListener(
        eventEmitter.EMITTED_EVENTS.TIMEOUT,
        listener);

      if(timedOut === false) {
        self.isInProgress = false;
        return callback(err, Date.now() - startTime, res);
      }
    });
  }
};
