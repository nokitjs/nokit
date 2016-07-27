/* global it */
/* global describe */
const assert = require("assert");
const app = require("./app");
const request = require('supertest');

describe('Router', function () {

  it('GET /route/test', function (done) {
    request(app.server.httpServer)
      .get("/route/test")
      .expect(404, done);
  });

  it('GET /route/123', function (done) {
    request(app.server.httpServer)
      .get("/route/123")
      .expect(200, '123', done);
  });

});