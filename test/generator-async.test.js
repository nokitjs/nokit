/* global it */
/* global describe */
const assert = require("assert");
const app = require("./app");
const request = require('supertest');

describe('generator-async', function() {
  it('GET /generatorAsync', function(done) {
    request(app.server.httpServer)
      .get("/generatorAsync?n=10")
      .expect(200, '100', done);
  });
});