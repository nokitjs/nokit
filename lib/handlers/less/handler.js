var fs = require("fs");
var less = require("less");

var ALLOWED_METHODS = ["GET"];

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
            // less 只允许 get 请求
            if (ALLOWED_METHODS.indexOf(context.request.method) < 0) {
                context.notAllowed();
                return;
            }
            fs.readFile(context.request.physicalPath, function(err, data) {
                if (err) {
                    context.error(err);
                } else {
                    less.render(data.toString(), function(err, output) {
                        if (err) {
                            context.error(err);
                        } else {
                            context.content(output.css, self.server.mime('.css'));
                        }
                    });
                }
            });
        } else {
            self.transfer(context);
        }
    });
};