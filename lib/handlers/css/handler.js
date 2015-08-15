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
    var lessHandler = self.server.handler('.less');
    if (context.request.physicalPathExists) {
        self.transfer(context);
    } else if (lessHandler) {
        context.request.setPhysicalPath(context.request.physicalPath.replace('.css', '.less'));
        lessHandler.handle(context);
    } else {
        self.transfer(context);
    }
};