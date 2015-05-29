var less = require("./lib");
var fs = require("fs");

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
};

//处理请求
Handler.prototype.handleRequest = function(req, res) {
    var self = this;
    fs.exists(req.physicalPath, function(exists) {
        if (exists) {
            fs.readFile(req.physicalPath, function(err, data) {
                if (err) {
                    self.server.responseError(req, res, err);
                } else {
                    less.render(data.toString(), function(err, cssText) {
                        if (err) {
                            self.server.responseError(req, res, err);
                        } else {
                            self.server.responseContent(req, res, cssText, self.configs.mimeType['.css']);
                        }
                    });
                }
            });
        } else {
            self.server.responseNotFound(req, res);
        }
    });
};