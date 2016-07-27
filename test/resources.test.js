/* global it */
/* global describe */
const assert = require("assert");
const app = require("./app");
const request = require('supertest');

describe('Resources', function() {
  it('GET /-rc-/stylesheets/common.css', function(done) {
    request(app.server.httpServer)
      .get("/-rc-/stylesheets/common.css")
      .expect(200, done);
  });
}); 