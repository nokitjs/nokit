/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

describe('Filter', function() {
  it('GET /filter-test', function(done) {
    request(app.server.httpServer)
      .get("/filter-test")
      .expect(200, '123', done);
  });
});