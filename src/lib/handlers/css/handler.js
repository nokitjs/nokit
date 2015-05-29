var fs = require("fs");
var path = require("path");

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
                    self.server.responseContent(req, res, data.toString(), self.configs.mimeType['.css']);
                }
            });
        } else if (self.server.handlers['.less']) {
            req.physicalPath = req.physicalPath.replace('.css', '.less');
            self.server.handlers['.less'].handleRequest(req, res);
        } else {
            self.server.responseNotFound(req, res);
        }
    });
};