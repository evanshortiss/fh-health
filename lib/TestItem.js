
var eventEmitter = require('./TestEvents');
var TIMEOUT_MSG = 'The test didn\'t complete before the alotted time frame.';

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

TestItem.prototype._onTimeout = function() {
  this._end();
}

TestItem.prototype.getDescription = function() {
  return this.desc;
};

TestItem.prototype.isCritical = function() {
  return this.critical;
};

TestItem.prototype.getTestFn = function() {
  return this.testFn;
};

TestItem.prototype.getStartTime = function() {
  if (!this.isInProgress) {
    throw new Error('Called ' + this.name + 'when test wasn\'t running');
  }

  return this.startTime;
};

TestItem.prototype.getRunTime = function() {
  return Date.now() - this.getStartTime();
};

/** 
 * Start running the test case.
 * @param {Function}  callback
 */
TestItem.prototype.run = function(callback) {
  if (this.isInProgress) {
    console.warn(new Date().toJSON() + ' fh-health: Called run method for test "' + this.getDescription() + '" while it was already running');
  } else {
    var self = this,
      startTime = Date.now(),
      timedOut = false;

    this.isInProgress = true;

    var listener = function() {
      timedOut = true;
      callback(TIMEOUT_MSG, Date.now() - startTime, TIMEOUT_MSG);
    };
    // Register a handler to end this test if necessary
    eventEmitter.once(eventEmitter.EMITTED_EVENTS.TIMEOUT, listener);

    // Run the test function with a conditional callback
    this.getTestFn()(function(err, res) {
      eventEmitter.removeListener(eventEmitter.EMITTED_EVENTS.TIMEOUT, listener);
      if(timedOut === false) {
        callback(err, Date.now() - startTime, res);
      }
    });
  }
};




