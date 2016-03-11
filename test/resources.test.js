/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

describe('Resources', function() {
  it('GET /-rc-/stylesheets/common.css', function(done) {
    request(app.server.httpServer)
      .get("/-rc-/stylesheets/common.css")
      .expect(200, done);
  });
}); 