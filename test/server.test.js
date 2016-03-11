/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");

describe('Server', function() {

  it("启动后停止", function(done) {
    app.server.start(function(err, info) {
      app.server.logger.info('logger info: server started');
      assert.equal(err, null);
      app.server.stop(function(err, info) {
        assert.equal(err, null);
        app.server.logger.warn('logger warn: server stopd');
        done();
      });
    });
  });

});