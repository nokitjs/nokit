var fs = require("fs");
var path = require("path");

var RESOURCE_PATH = "$./resources/";
var URL_PREFIX = "/__res__/";
var STATIC_HANDLER_NAME="static";

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
};

//处理请求
Handler.prototype.handle = function(context) {
    var self = this;
    var resPath = self.server.resolvePath(context.request.url.replace(URL_PREFIX, RESOURCE_PATH));
    context.request.setPhysicalPath(resPath);
    var staticHandler = self.server.getHandlerByName(STATIC_HANDLER_NAME);
    if (staticHandler) {
        staticHandler.handle(context);
    } else {
        context.notFound();
    }
};