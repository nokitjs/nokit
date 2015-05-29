var fs = require("fs");
var path = require("path");

var RESOURCE_PATH = "./resources/";
var URL_PREFIX = "/__res__/";

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
};

//处理请求
Handler.prototype.handleRequest = function(req, res) {
    var self = this;
    req.physicalPath = path.resolve(self.server.installPath, req.url.replace(URL_PREFIX, RESOURCE_PATH));
    if (self.server.handlers['*']) {
        self.server.handlers['*'].handleRequest(req, res);
    } else {
        self.server.responseNotFound(req, res);
    }
};