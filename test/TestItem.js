'use strict';

var assert = require('assert')
  , TestItem = require('../lib/TestItem')
  , TestEvents = require('../lib/TestEvents');

var instance = null;

var DESC = 'DESC!'
  , PASS_VAL = 'OK'
  , FAIL_VAL = 'DAMN'
  , FN = function (cb){
    setTimeout(function () {
      cb(null, PASS_VAL);
    }, 10);
  },
  FN_FAIL = function (cb) {
    setTimeout(function () {
      cb(FAIL_VAL, null);
    }, 10);
  };

describe('TestItem class', function () {

  describe('#TestItem', function () {
    it('Should create a TestItem instance', function (){
      instance = new TestItem(DESC, FN, true);
      assert.equal(instance instanceof TestItem, true);
      assert.equal(instance.isInProgress, false);
    });

    it('Should create a TestItem with non-critical priority', function () {
      instance = new TestItem('some desc', function(){});
      assert.equal(instance.critical, false);
    });

    it('Should create a TestItem with critical priority', function () {
      instance = new TestItem(DESC, FN, true);
      assert.equal(instance.critical, true);
    });
  });

  describe('#getDescription', function () {
    it('Should return description passed in ctor', function () {
      instance = new TestItem(DESC, FN);
      assert.equal(instance.getDescription(), DESC);
    });
  });

  describe('#isCritical', function () {
    it('Should return true', function () {
      instance = new TestItem(DESC, FN, true);
      assert.equal(instance.isCritical(), true);
    });

    it('Should return false', function () {
      instance = new TestItem(DESC, FN, false);
      assert.equal(instance.isCritical(), false);
    });
  });

  describe('#getTestFn', function () {
    it('Should return a function', function () {
      instance = new TestItem(DESC, FN);
      assert.equal(typeof instance.getTestFn(), 'function');
      assert.equal(instance.getTestFn(), FN);
    });
  });

  describe('#run', function () {
    it('Should run a sample test item', function (done) {
      instance = new TestItem(DESC, FN);
      instance.run(done);
    });

    it('Should return an error from the test being run', function (done) {
      instance = new TestItem(DESC, FN_FAIL);
      instance.run(function (err, time, res) {
        assert.equal(err, FAIL_VAL);
        assert.equal(typeof time, 'number');
        assert.equal(res, null);

        done();
      });
    });

    it('Should have an error due to timeout', function (done) {
      instance = new TestItem(DESC, FN);
      instance.run(function (err, time, res) {
        assert.notEqual(err, null);
        assert.notEqual(time, null);
        assert.notEqual(res, null);

        done();
      });

      setTimeout(function () {
        TestEvents.emit(TestEvents.EMITTED_EVENTS.TIMEOUT);
      }, 0);
    });

    it('Shouldn\'t encounter an error despite double call', function () {
      instance = new TestItem(DESC, FN);
      var finished = false;

      function cb1(err) {
        assert(!err);

        if(finished === true) {
          done();
        } else {
          finished = true;
        }
      }

      function cb2(err) {
        assert(!err);

        if(finished === true) {
          done();
        } else {
          finished = true;
        }
      }

      instance.run(cb1);
      instance.run(cb2);
    });
  });
});
