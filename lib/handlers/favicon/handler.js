const fs = require("fs");
const path = require("path");

const FAVICON_PATH = "$./resources/favicons/favicon.ico";

const Handler = module.exports = function (server) {
  var self = this;
  self.server = server;
  self.configs = self.server.configs;
};

//处理请求
Handler.prototype.handle = function (context) {
  var self = this;
  context.request.physicalPathExists(function (exists) {
    if (!exists) {
      var resPath = self.server.resolvePath(FAVICON_PATH);
      context.request.setPhysicalPath(resPath);
    }
    self.next(context);
  });
};