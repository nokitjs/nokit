/* global it */
/* global describe */
const assert = require("assert");
const app = require("./app");
const request = require('supertest');

describe('buffer', function() {
  it('GET /buffer', function(done) {
    request(app.server.httpServer)
      .get("/buffer")
      .expect(200, 'test', done);
  });
});