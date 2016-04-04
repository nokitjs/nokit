var fs = require("fs");
var path = require("path");
var GeneralController = require("./general-controller");

var DFAULT_ALLOWED_METHODS = ["GET", "POST"];
var DEFAULT_ACTION = "index";

var Handler = module.exports = function(server) {
  var self = this;
  self.server = server;
  self.configs = self.server.configs;
  self.configs.mvc = self.configs.mvc || {};
  self.utils = self.server.utils;
  self.generator = self.server.require("$./core/generator");
  //检查并创建视图引擎
  self.viewEngine = server.viewEngine;
  //初始化 router
  self.router = new server.Router(self.configs.mvc.routes, {
    "defaultMethods": DFAULT_ALLOWED_METHODS
  });
  //初始化 controller / view 存放根路径
  self.configs.mvc.paths = self.configs.mvc.paths || {};
  self.paths = {};
  self.paths.controller = self.server.resolvePath(self.configs.mvc.paths.controller || './');
  self.paths.view = self.server.resolvePath(self.configs.mvc.paths.view || './');
};

//处理请求
Handler.prototype.handle = function(context) {
  var self = this;
  //查找路由
  var routes = self.router.get(context.request.withoutQueryStringURL, true);
  //如果找不到匹配路由，转交到默认处理器
  if (!routes || routes.length < 1) {
    self.next(context);
    return;
  }
  // mvc 根据路由配置决定支持的 http method，默认为 get、post
  var httpMethod = context.request.method;
  var route = self.router.matchByMethod(routes, httpMethod);
  if (!route) {
    context.notAllowed();
    return;
  }
  //扩展 context
  context.route = route;
  //控制器处理
  var controller = null;
  //加载 controller 
  if (route.controller) {
    var controllerFile = self.server.resolvePath(route.controller, self.paths.controller);
    //console.log(controllerFile);
    var Controller = require(controllerFile);
    self.generator.wrap(Controller.prototype);
    controller = new Controller(context);
  } else if (route.view) {
    //如果直接在路由中配置了 view 而没有配置 controller
    controller = new GeneralController(context);
    controller.view = route.view;
  } else {
    return context.error('Route "' + route.pattern + '" configuration error');
  }
  //检查 action 是否存在
  context.route.action = context.route.action || DEFAULT_ACTION;
  var action = context.route.action;
  /**
   * 如果 action 包含在 url 中，没有找到 action 时直接 next
   * 如果 action 为默认 index 或 “明确指定”，则提示 action 没有找到
   **/
  if (!controller[action] && route.actionFromUrl) {
    return self.next(context);
  } else if (!controller[action]) {
    return context.error('The action "' + action + '" not found');
  }
  context.controller = controller;
  context.action = action;
  context.shouldCompress = self.configs.mvc.compress;
  context.shouldCache = self.configs.mvc.cache;
  controller.context = context;
  controller.session = context.session;
  controller.server = context.server;
  controller.response = context.response;
  controller.request = context.request;
  controller.route = context.route;
  controller.locale = context.locale;
  //渲染方法
  controller.render = function(viewPath, model) {
    if (self.utils.isNull(viewPath)) {
      return context.error('"controller.render" method need a view');
    }
    if (viewPath[0] != '.') {
      viewPath = './' + viewPath;
    }
    var viewFile = self.server.resolvePath(viewPath, self.paths.view);
    //在 mvc 的模板中 this 一般指向 model，默认指向 controller
    model = model || controller;
    var buffer = self.viewEngine.executeFile(viewFile, model, {
      "extend": {
        "controller": controller,
        "context": context,
        "locale": context.locale,
        "route": route,
        "server": context.server,
        "session": context.session
      }
    });
    context.send(buffer, 'text/html');
  };
  //准备就绪方法，此方法将触发 action 的调用
  //如果定义了 init 方法，需要手动调用 ready
  self.utils.defineOnceFunc(controller, 'ready', function(err) {
    if (err) {
      return context.error(err);
    }
    //调用 action
    var ps = controller[action](context);
    self.utils.checkPromise(ps, context.error);
  });
  //--
  context.filterInvoker.invoke('onMvcHandle', context, function(err) {
    if (err) {
      return context.error(err);
    }
    //调用 init 方法
    if (controller.init) {
      var ps = controller.init(context, controller.ready);
      self.utils.checkPromise(ps, context.error);
    } else {
      controller.ready();
    }
  });
};
/*end*/