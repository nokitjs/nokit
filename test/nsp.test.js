/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

describe('NSP', function() {

  it('GET /example-1.nsp', function(done) {
    request(app.server.httpServer)
      .get("/example-1.nsp")
      .expect(200, 'nsp', done);
  });

  it('GET /test-1.nsp', function(done) {
    request(app.server.httpServer)
      .get("/test-1.nsp")
      .expect(200, 'nsp', done);
  });

  it('GET /example-2.nsp', function(done) {
    request(app.server.httpServer)
      .get("/example-2.nsp")
      .expect(200, 'nsp', done);
  });

  it('GET /form.nsp', function(done) {
    request(app.server.httpServer)
      .get("/form.nsp")
      .expect(200, done);
  });

  it('POST /form.nsp', function(done) {
    request(app.server.httpServer)
      .post("/form.nsp")
      .send("__method=add&__args=%5B1%5D&__state=PGlucHV0IG5zcC1pZD0iYm94IiB0eXBlPSJ0ZXh0IiB2YWx1ZT0iMSI%2B")
      .expect(200, done);
  });

});