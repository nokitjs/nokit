const fs = require("fs");
const path = require("path");

const RESOURCE_PATH = "$./resources/";
const URL_PREFIX = "/-rc-/";
const STATIC_HANDLER_NAME = "static";

const Handler = module.exports = function(server) {
  var self = this;
  self.server = server;
  self.configs = self.server.configs;
  self.configs.resource = self.configs.resource || {};
};

//处理请求
Handler.prototype.handle = function(context) {
  var self = this;
  var resPath = self.server.resolvePath(context.request.url.replace(URL_PREFIX, RESOURCE_PATH));
  context.request.setPhysicalPath(resPath);
  var staticHandler = self.server.getHandlerByName(STATIC_HANDLER_NAME);
  if (staticHandler) {
    context.shouldCompress = self.configs.resource.compress;
    context.shouldCache = self.configs.resource.cache;
    staticHandler.handle(context);
  } else {
    context.notFound();
  }
};