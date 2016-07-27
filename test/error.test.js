/* global it */
/* global describe */
const assert = require("assert");
const app = require("./app");
const request = require('supertest');

describe('Error', function() {
  it('GET /emitError', function(done) {
    request(app.server.httpServer)
      .get("/emitError")
      .expect(500, done);
  });
});