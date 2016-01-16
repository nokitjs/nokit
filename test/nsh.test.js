/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

app.server.start(function () {

    describe('NSH', function () {
        it('GET /example.nsh', function (done) {
            request(app.server.httpServer)
                .get("/example.nsh")
                .expect(200, 'nsh', done);
        });
    });

});