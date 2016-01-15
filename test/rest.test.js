/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var request = require('supertest');

app.server.start(function () {

    describe('RESTful Service', function () {
        it('GET /api/item', function (done) {
            request(app.server.httpServer)
                .get("/api/item")
                .expect(200, { "name": "GET" }, done);
        });
        it('POST /api/item', function (done) {
            request(app.server.httpServer)
                .post("/api/item")
                .expect(200, { "name": "POST" }, done);
        });
        it('PUT /api/item', function (done) {
            request(app.server.httpServer)
                .put("/api/item")
                .expect(200, { "name": "PUT" }, done);
        });
        it('DELETE /api/item', function (done) {
            request(app.server.httpServer)
                .delete("/api/item")
                .expect(200, { "name": "DELETE" }, done);
        });
    });

});