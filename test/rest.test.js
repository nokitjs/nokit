/* global it */
/* global describe */
const assert = require("assert");
const app = require("./app");
const request = require('supertest');

describe('RESTful Service', function () {

  it('GET /api/item', function (done) {
    request(app.server.httpServer)
      .get("/api/item")
      .set('Content-Type', 'text/json')
      .send("{}")
      .expect(200, { "name": "GET" }, done);
  });

  it('POST /api/item', function (done) {
    request(app.server.httpServer)
      .post("/api/item")
      .set('Content-Type', 'text/plain')
      .send("name=test")
      .expect(200, { "name": "POST" }, done);
  });

  it('POST /api/item', function (done) {
    request(app.server.httpServer)
      .post("/api/item")
      .set('Content-Type', 'multipart/form-data')
      .expect(200, { "name": "POST" }, done);
  });

  it('PUT /api/item', function (done) {
    request(app.server.httpServer)
      .put("/api/item")
      .set('Content-Type', 'text/xml')
      .send("<root></root>")
      .expect(200, done);
  });

  it('DELETE /api/item', function (done) {
    request(app.server.httpServer)
      .delete("/api/item")
      .expect(200, { "name": "DELETE" }, done);
  });

});