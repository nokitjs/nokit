/* global it */
/* global describe */
const assert = require("assert");
const app = require("./app");
const request = require('supertest');

describe('favicon', function() {
  it('GET /favicon.icon', function(done) {
    request(app.server.httpServer)
      .get("/favicon.icon")
      .expect(200, done);
  });
});