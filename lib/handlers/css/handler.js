var fs = require("fs");
var path = require("path");

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
};

//处理请求
Handler.prototype.handleRequest = function(context) {
    var self = this;
    var lessHandler = self.server.handlers['.less'];
    if (context.request.physicalPathExists) {
        self.transferRequest(context);
    } else if (lessHandler) {
        context.request._setPhysicalPath(context.request.physicalPath.replace('.css', '.less'));
        lessHandler.handleRequest(context);
    } else {
        self.transferRequest(context);
    }
};