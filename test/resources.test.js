/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

app.server.start(function () {

    describe('Resources', function () {
        it('GET /-rc-/common.css', function (done) {
            request(app.server.httpServer)
                .get("/-rc-/common.css")
                .expect(200, done);
        });
    });

});