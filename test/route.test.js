/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

describe('Router', function() {

  it('GET /route/test', function(done) {
    request(app.server.httpServer)
      .get("/route/test")
      .expect(404, done);
  });

  it('GET /route/123', function(done) {
    request(app.server.httpServer)
      .get("/route/123")
      .expect(200, '123', done);
  });

});