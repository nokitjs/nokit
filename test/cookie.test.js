/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

describe('cookie', function() {
  it('GET /cookie', function(done) {
    request(app.server.httpServer)
      .get("/cookie")
      .set("Cookie", "test=test")
      .expect(200, "test", done);
  });
});