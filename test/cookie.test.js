/* global it */
/* global describe */
const assert = require("assert");
const app = require("./app");
const request = require('supertest');

describe('cookie', function() {
  it('GET /cookie', function(done) {
    request(app.server.httpServer)
      .get("/cookie")
      .set("Cookie", "test=test")
      .expect(200, "test", done);
  });
});