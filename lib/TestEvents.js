'use strict';


var EventEmitter = require('events').EventEmitter;

var emitter = new EventEmitter();

emitter.EMITTED_EVENTS = {
  TIMEOUT: 'TIMEOUT'
};

module.exports = emitter;


