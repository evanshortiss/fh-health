'use strict';

var logger = require('winston');

//set logger output levels
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

// remove old transport defintion
logger.remove(logger.transports.Console);

//set new custom logger definition
logger.add(logger.transports.Console, {
    level: 'debug',
    colorize: true,
    handleExceptions: true,
    json: false,
    timestamp: function() {
        return new Date().toUTCString();
    }
});

// return custom logger
module.exports = logger.log;