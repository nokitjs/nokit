var fs = require("fs");
var path = require("path");

var Handler = module.exports = function(server) {
  var self = this;
  self.server = server;
  self.configs = self.server.configs;
  self.configs.nsh = self.configs.nsh || {};
  self.utils = self.server.utils;
  //初始化 router
  self.router = new server.Router(self.configs.nsh.routes);
  //初始化 path 存放根路径
  self.path = self.server.resolvePath(self.configs.nsh.path || './');
  self.generator = self.server.require("$./core/generator");
};

//处理请求
Handler.prototype.handle = function(context) {
  var self = this;
  //查找路由
  var route = self.router.get(context.request.withoutQueryStringURL)[0];
  //如果找到路由则修改目标路径
  if (route) {
    //扩展 context
    context.route = route;
    //控制器处理
    var physicalPath = self.server.resolvePath(route.target, self.path);
    context.request.setPhysicalPath(physicalPath);
  }
  //开始处理
  context.request.setPhysicalPath(context.request.physicalPath + '.js');
  context.request.physicalPathExists(function(exists) {
    if (exists) {
      var HttpHandler = require(context.request.physicalPath);
      self.generator.wrap(HttpHandler.prototype);
      var httpHandler = new HttpHandler(self.server);
      context.shouldCompress = self.configs.nsh.compress;
      context.shouldCache = self.configs.nsh.cache;
      httpHandler.context = context;
      var ps = httpHandler.handle(context);
      self.utils.checkPromise(ps, context.error);
    } else {
      self.next(context);
    }
  });
};