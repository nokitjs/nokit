/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

app.server.start(function () {

    describe('MVC', function () {
        it('GET /', function (done) {
            request(app.server.httpServer)
                .get("/")
                .expect(200, done);
        });

        it('POST /', function (done) {
            request(app.server.httpServer)
                .post("/")
                .expect(200, done);
        });
    });

});