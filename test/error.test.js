/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

describe('Error', function() {
  it('GET /emitError', function(done) {
    request(app.server.httpServer)
      .get("/emitError")
      .expect(500, done);
  });
});