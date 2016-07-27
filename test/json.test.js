/* global it */
/* global describe */
const assert = require("assert");
const app = require("./app");
const request = require('supertest');

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