/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

describe('MVC', function() {
  it('GET /', function(done) {
    request(app.server.httpServer)
      .get("/")
      .expect(200, done);
  });

  it('POST /', function(done) {
    request(app.server.httpServer)
      .post("/")
      .expect(200, done);
  });

  it('DELETE /', function(done) {
    request(app.server.httpServer)
      .delete("/")
      .expect(405, done);
  });

  it('GET /not-found', function(done) {
    request(app.server.httpServer)
      .get("/not-found")
      .expect(404, done);
  });

  it("GET /say/{name}", function(done) {
    request(app.server.httpServer)
      .get("/say/nokit")
      .expect(200, "nokit", done);
  });

  it("POST /say/{name}", function(done) {
    request(app.server.httpServer)
      .post("/say/nokit")
      .expect(405, done);
  });

  it("GET /no-controller-view", function(done) {
    request(app.server.httpServer)
      .post("/no-controller-view")
      .expect(200, 'test', done);
  });

});