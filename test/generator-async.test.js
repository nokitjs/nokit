/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

describe('generator-async', function() {
  it('GET /generatorAsync', function(done) {
    request(app.server.httpServer)
      .get("/generatorAsync?n=10")
      .expect(200, '100', done);
  });
});