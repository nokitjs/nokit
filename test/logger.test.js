/* global nokit */
/* global it */
/* global describe */
const assert = require("assert");
const app = require("./app");
const Logger = nokit.Logger;

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