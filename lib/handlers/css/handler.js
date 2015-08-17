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
    context.request.physicalPathExists(function(exists) {
        if (exists) {
            self.transfer(context);
        } else {
            //如果不符合自已的处理要求，也不关心接下来那个 handler 处理，一般直接调用 self.transfer 向下传递
            //但是这里不能直接传递，直接传递并不能确保 less handler 能接收到，所以这里直接调用 less handler
            var lessHandler = self.server.handler('.less');
            if (lessHandler) {
                context.request.setPhysicalPath(context.request.physicalPath.replace('.css', '.less'));
                lessHandler.handle(context);
            } else {
                self.transfer(context);
            }
        }
    });
};