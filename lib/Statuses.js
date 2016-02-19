'use strict';

module.exports = {
  TYPES: {
    OK: 'ok',
    WARN: 'warn',
    CRITICAL: 'crit'
  },
  TEXT: {
    OK: 'No issues to report. All tests passed without error.',
    WARN: 'Some non-critical tests encountered issues. See the ' +
      '"details" object for specifics.',
    CRITICAL: 'A critical test item encountered an error. Please' +
      ' investigate this. See the "details" object for specifics.'
  }
};
