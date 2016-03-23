/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

describe('静态文件处理', function() {
  it('GET /', function(done) {
    request(app.server.httpServer)
      .get("/")
      .expect(200, done);
  });

  it('POST /', function(done) {
    request(app.server.httpServer)
      .post("/")
      .expect(200, done);
  });

  it('GET /style', function(done) {
    request(app.server.httpServer)
      .get("/style")
      .expect(302, done);
  });

  it('GET /style/', function(done) {
    request(app.server.httpServer)
      .get("/style/")
      .expect(200, done);
  });

  it('GET /pages/', function(done) {
    request(app.server.httpServer)
      .get("/pages/")
      .expect(200, 'default-file', done);
  });

  it('GET /public-test1/test.txt', function(done) {
    request(app.server.httpServer)
      .get("/public-test1/test.txt")
      .expect(200, "test1", done);
  });

  it('GET /public-test2/test.txt', function(done) {
    request(app.server.httpServer)
      .get("/public-test2/test.txt")
      .expect(200, "test2", done);
  });

});