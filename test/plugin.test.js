/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");

describe('Server plugin', function() {
  it('use plugin', function(done) {
    assert.notEqual(app.server.plugins["test"], null);
    done();
  });
  it('init plugin', function(done) {
    assert.equal(app.server.testPlugin, true);
    done();
  });
});