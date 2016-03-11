/* global nokit */
/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var Logger = nokit.Logger;

describe('Logger', function() {

  it('logger.write', function() {
    var logger = new Logger();
    assert.notEqual(logger, null);
    logger.write("L", "test");
  });

  it('logger.error', function() {
    var logger = new Logger();
    assert.notEqual(logger, null);
    logger.error();
  });

});