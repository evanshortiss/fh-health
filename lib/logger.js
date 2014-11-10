'use strict';

var logger = require('winston')
  , enableColorize = false
  , enableJSON = false;

// enable Colourized output
// defaults to false
function setColorizedLogs(val) {
    enableColorize = val;
    configureLogger();
}

// enable JSON formatted output
// defaults to false
function enableJsonFormatedLogs(val) {
    enableJSON = val;
    configureLogger();
}

// expose logger config options
exports.enableJsonFormat = enableJsonFormatedLogs;
exports.enableColorize = setColorizedLogs;

// set logger output levels
logger.setLevels({
    debug: 0,
    info: 1,
    silly: 2,
    warn: 3,
    error: 4
});

// set logger out colors
logger.addColors({
    debug: 'info',
    info: 'green',
    silly: 'magenta',
    warn: 'yellow',
    error: 'red'
});

function configureLogger () {
  // remove old transport defintion
  logger.remove(logger.transports.Console);

  // set new custom logger definition
  logger.add(logger.transports.Console, {
      level: 'debug',
      colorize: enableColorize,
      handleExceptions: true,
      json: enableJSON,
      timestamp: function() {
          return new Date().toJSON();
      }
  });
}

// return custom logger
module.exports = logger.log;
