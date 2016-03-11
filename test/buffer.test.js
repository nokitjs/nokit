/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

describe('buffer', function() {
  it('GET /buffer', function(done) {
    request(app.server.httpServer)
      .get("/buffer")
      .expect(200, 'test', done);
  });
});