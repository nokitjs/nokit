/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

describe('locales', function() {
  it('en /locale', function(done) {
    request(app.server.httpServer)
      .get("/locale")
      .expect(200, "hello", done);
  });

  it('zh /locale', function(done) {
    request(app.server.httpServer)
      .get("/locale")
      .set('Accept-Language', 'zh-CN,zh;q=0.8,zh-TW;q=0.6,en;q=0.4,ja;q=0.2,pt;q=0.2,ru;q=0.2')
      .expect(200, "你好", done);
  });
});