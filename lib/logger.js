'use strict';

var Logger = require('winston')
  , enableColorize = false
  , enableJSON = false
  , enableSilentLogs = false
  , logLevel = 'debug';

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

// enable JSON formatted output
// defaults to false
function setLogLevel(val) {
    logLevel = val;
    configureLogger();
}

// enable JSON formatted output
// defaults to false
function silenceLogs(val) {
    enableSilentLogs = val;
    configureLogger();
}

//set logger output levels
Logger.setLevels({
    debug: 0,
    info: 1,
    silly: 2,
    warn: 3,
    error: 4
});

// set Logger out colors
Logger.addColors({
    debug: 'green',
    info: 'cyan',
    silly: 'magenta',
    warn: 'yellow',
    error: 'red'
});

function configureLogger() {
    // remove old transport defintion
    Logger.remove(Logger.transports.Console);

    //set new custom Logger definition
    Logger.add(Logger.transports.Console, {
        silent: enableSilentLogs,
        level: logLevel,
        colorize: enableColorize,
        handleExceptions: true,
        json: enableJSON,
        timestamp: function() {
            return new Date().toJSON();
        }
    });
}

configureLogger();

// retunr custom logger
module.exports = {
    getLogger: function() {
        return Logger.log;
    },
    enableJsonFormatedLogs: enableJsonFormatedLogs,
    setColorizedLogs: setColorizedLogs,
    setLogLevel: setLogLevel,
    silenceLogs: silenceLogs
};