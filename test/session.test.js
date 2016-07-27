/* global it */
/* global describe */
const assert = require("assert");
const app = require("./app");
const request = require('supertest');

describe('Session', function () {
  it('GET /home/readAndWriteSession?val=2', function (done) {
    request(app.server.httpServer)
      .get("/home/readAndWriteSession?val=2")
      .expect(200, '4', done);
  });
});