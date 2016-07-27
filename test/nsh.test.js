/* global it */
/* global describe */
const assert = require("assert");
const app = require("./app");
const request = require('supertest');

describe('NSH', function() {

  it('GET /example.nsh', function(done) {
    request(app.server.httpServer)
      .get("/example.nsh")
      .expect(200, 'nsh', done);
  });

  it('GET /test.nsh', function(done) {
    request(app.server.httpServer)
      .get("/test.nsh")
      .expect(200, 'nsh', done);
  });

});