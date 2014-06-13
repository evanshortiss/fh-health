'use strict';

var assert = require('assert')
  , TestEvents = require('../lib/TestEvents');

var wasCalled = false;
var FN = function (ev) {
  wasCalled = true;
};

describe('TestEvents', function () {

  beforeEach(function () {
    wasCalled = false;
  });

  describe('#on', function () {
    it('Should bind a function for an event', function () {
      TestEvents.on(TestEvents.EMITTED_EVENTS, FN);
    });
  });

  describe('#emit', function () {
    it('Should call bound function for an event', function () {
      TestEvents.emit(TestEvents.EMITTED_EVENTS);
      assert.equal(wasCalled, true);
    });
  });

})
