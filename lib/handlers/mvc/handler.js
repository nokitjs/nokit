 var fs = require("fs");
 var path = require("path");

 var routing = null;
 var pagine = null;

 var Handler = module.exports = function(server) {
     var self = this;
     self.server = server;
     self.configs = self.server.configs;
     self.utils = self.server.require('./core/utils');
     //检查并创建视图引擎
     pagine = pagine || ((function() {
         var Pagine = self.server.require('./core/pagine');
         return new Pagine();
     })());
     //检查并初始化 routing
     routing = routing || ((function() {
         var Routing = self.server.require('./core/routing');
         return new Routing(self.configs.mvc.routes);
     })());
     //初始化 controller / view 存放根路径
     self.configs.mvc.paths = self.configs.mvc.paths || {};
     self.paths = {};
     self.paths.controller = self.server.resolveAppPath(self.configs.mvc.paths.controller || './');
     self.paths.view = self.server.resolveAppPath(self.configs.mvc.paths.view || './');
 };

 //处理请求
 Handler.prototype.handleRequest = function(context) {
     var self = this;
     //console.log('请求方法：' + context.request.method);
     var route = routing.get(context.request.url);
     //如果找不到匹配路由，转交到默认处理器
     if (!route) {
         self.transferRequest(context);
         return;
     }
     //扩展 context
     context.route = route;
     context.routeData = route.data;
     //控制器处理
     var controllerFile = path.resolve(self.paths.controller, route.target);
     //console.log(controllerFile);
     var Controller = require(controllerFile);
     var controller = new Controller(context);
     //检查 action 是否存在
     var action = context.route.action || "index";
     if (!controller[action]) {
         context.responseError('没有定义 Action "' + action + '"');
         return;
     }
     controller.context = context;
     controller.render = function(viewPath, model) {
         var viewFile = path.resolve(self.paths.view, viewPath);
         var buffer = pagine.execFile(viewFile, model);
         context.responseContent(buffer, 'text/html');
     };
     //调用 init 方法
     if (controller.init) {
         controller.init(context);
     }
     //调用 action
     controller[action]();
 };