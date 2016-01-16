/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

app.server.start(function () {

    describe('NSP', function () {
        it('GET /example-1.nsp', function (done) {
            request(app.server.httpServer)
                .get("/example-1.nsp")
                .expect(200, 'nsp', done);
        });
        it('GET /example-2.nsp', function (done) {
            request(app.server.httpServer)
                .get("/example-2.nsp")
                .expect(200, 'nsp', done);
        });
    });

});