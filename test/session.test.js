/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

describe('Session', function() {
  it('GET /home/readAndWriteSession?val=2', function(done) {
    request(app.server.httpServer)
      .get("/home/readAndWriteSession?val=2")
      .expect(200, '4', done);
  });
});