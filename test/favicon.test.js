/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

app.server.start(function () {

    describe('favicon', function () {
        it('GET /favicon.icon', function (done) {
            request(app.server.httpServer)
                .get("/favicon.icon")
                .expect(200, done);
        });
    });

});