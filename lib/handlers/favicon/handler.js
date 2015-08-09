var fs = require("fs");
var path = require("path");

var FAVICON_PATH = "./resources/favicons/favicon.ico";

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
};

//处理请求
Handler.prototype.handleRequest = function(context) {
    var self = this;
    if (!context.request.physicalPathExists) {
        var resPath = self.server.resolveSystemPath(FAVICON_PATH);
        context.request._setPhysicalPath(resPath);
    }
    if (self.server.handlers['*']) {
        self.server.handlers['*'].handleRequest(context);
    } else {
        context.responseNotFound();
    }
};