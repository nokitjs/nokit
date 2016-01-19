/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

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

    it('GET /statusWithContent/{code}', function (done) {
        request(app.server.httpServer)
            .get("/statusWithContent/200")
            .expect(200, done);
    });

    it('GET /statusWithContent/{code}', function (done) {
        request(app.server.httpServer)
            .get("/statusWithContent/404")
            .expect(404, done);
    });
});