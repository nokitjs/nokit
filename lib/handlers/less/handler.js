var fs = require("fs");
var less = require("less");

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
};

//处理请求
Handler.prototype.handleRequest = function(context) {
    var self = this;
    if (context.request.physicalPathExists) {
        fs.readFile(context.request.physicalPath, function(err, data) {
            if (err) {
                context.responseError(err);
            } else {
                less.render(data.toString(), function(err, cssText) {
                    if (err) {
                        context.responseError(err);
                    } else {
                        context.responseContent(cssText, self.configs.mimeType['.css']);
                    }
                });
            }
        });
    } else {
        context.responseNotFound();
    }
};