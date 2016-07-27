/* global it */
/* global describe */
const assert = require("assert");
const app = require("./app");
const request = require('supertest');

describe('status code', function () {
  it('GET /status/{code}', function (done) {
    request(app.server.httpServer)
      .get("/status/200")
      .expect(200, done);
  });

  it('GET /status/{code}', function (done) {
    request(app.server.httpServer)
      .get("/status/404")
      .expect(404, done);
  });

  it('GET /statusTemplate/{code}', function (done) {
    request(app.server.httpServer)
      .get("/statusTemplate/200")
      .expect(200, done);
  });

  it('GET /statusTemplate/{code}', function (done) {
    request(app.server.httpServer)
      .get("/statusTemplate/404")
      .expect(404, done);
  });

  it('GET /redirect', function (done) {
    request(app.server.httpServer)
      .get("/redirect")
      .expect(302, done);
  });

  it('GET /permanentRedirect', function (done) {
    request(app.server.httpServer)
      .get("/permanentRedirect")
      .expect(301, done);
  });

  it('GET /transfer', function (done) {
    request(app.server.httpServer)
      .get("/transfer")
      .expect(200, '"json"', done);
  });

  it('GET /notAllowed', function (done) {
    request(app.server.httpServer)
      .get("/notAllowed")
      .expect(405, done);
  });

  it('GET /forbidden', function (done) {
    request(app.server.httpServer)
      .get("/forbidden")
      .expect(403, done);
  });

  it('GET /notFound', function (done) {
    request(app.server.httpServer)
      .get("/notFound")
      .expect(404, done);
  });

  it('GET /noChange', function (done) {
    request(app.server.httpServer)
      .get("/noChange")
      .expect(304, done);
  });
});