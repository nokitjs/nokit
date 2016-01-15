/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

app.server.start(function () {

    describe('RESTful Service', function () {
        it('post /', function (done) {
            request(app.server.httpServer)
                .get("/")
                .expect(200, done);
        });

        it('post /', function (done) {
            request(app.server.httpServer)
                .post("/")
                .expect(200, done);
        });
    });

});