/* global it */
/* global describe */
const assert = require("assert");
const app = require("./app");
const request = require('supertest');

describe('Filter', function() {
  it('GET /filter-test', function(done) {
    request(app.server.httpServer)
      .get("/filter-test")
      .expect(200, '123', done);
  });
});