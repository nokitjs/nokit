/* global it */
/* global describe */
const assert = require("assert");
const app = require("./app");

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