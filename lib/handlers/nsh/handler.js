var fs = require("fs");
var path = require("path");

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
};

//处理请求
Handler.prototype.handle = function(context) {
    var self = this;
    context.request.setPhysicalPath(context.request.physicalPath + '.js');
    context.request.physicalPathExists(function(exists) {
        if (exists) {
            var HttpHandler = require(context.request.physicalPath);
            var httpHandler = new HttpHandler(self.server);
            httpHandler.context = context;
            httpHandler.handle();
        } else {
            self.next(context);
        }
    });
};