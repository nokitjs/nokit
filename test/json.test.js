/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

describe('json & jsonp', function() {
  it('GET /json', function(done) {
    request(app.server.httpServer)
      .get("/json")
      .expect(200, '"json"', done);
  });

  it('GET /jsonp', function(done) {
    request(app.server.httpServer)
      .get("/jsonp?callback=callback")
      .expect(200, '/**/callback("jsonp")', done);
  });
});