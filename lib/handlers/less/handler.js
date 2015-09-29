var fs = require("fs");
var less = require("less");
var path = require("path");

var ALLOWED_METHODS = ["GET"];

var Handler = module.exports = function (server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
};

//处理 请求
Handler.prototype.handle = function (context) {
    var self = this;
    var extname = path.extname(context.request.physicalPath);
    if (extname == '.css') {
        self.handleCSS(context);
    } else if (extname == '.less') {
        self.handleLESS(context);
    } else {
        self.next(context);
    }
};

//处理 css 请求
Handler.prototype.handleCSS = function (context) {
    var self = this;
    context.request.physicalPathExists(function (exists) {
        if (exists) {
            self.next(context);
        } else {
            context.request.setPhysicalPath(context.request.physicalPath.replace('.css', '.less'));
            self.handleLESS(context);
        }
    });
};

//处理 less 请求
Handler.prototype.handleLESS = function (context) {
    var self = this;
    context.request.physicalPathExists(function (exists) {
        if (exists) {
            // less 只允许 get 请求
            if (ALLOWED_METHODS.indexOf(context.request.method) < 0) {
                context.notAllowed();
                return;
            }
            fs.readFile(context.request.physicalPath, function (err, data) {
                if (err) {
                    context.error(err);
                } else {
                    less.render(data.toString(), function (err, output) {
                        if (err) {
                            context.error(err);
                        } else {
                            context.content(output.css, self.server.mime('.css'));
                        }
                    });
                }
            });
        } else {
            self.next(context);
        }
    });
};