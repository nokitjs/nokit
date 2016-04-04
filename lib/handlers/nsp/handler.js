var fs = require("fs");
var path = require("path");
var cheerio = require('cheerio');
var base64 = require("nb64");

var SERVER_ID_NAME = "nsp-id";
var HIDDEN_METHOD = "__method";
var HIDDEN_STATE = "__state";
var HIDDEN_ARGS = "__args";
var ALLOWED_METHODS = ["GET", "POST"];
var CLIENT_SCRIPT = '<script src="/-rc-/javascripts/nsp-client.js"></script>';

var DefaultPresenter = function() { };
var PresenterCache = {};

var Handler = module.exports = function(server) {
  var self = this;
  self.server = server;
  self.configs = self.server.configs;
  self.configs.nsp = self.configs.nsp || {};
  //--
  self.utils = self.server.require('$./core/utils');
  self.console = self.server.require('$./core/console');
  //检查并创建视图引擎
  self.viewEngine = server.viewEngine;
  //初始化 router
  self.router = new server.Router(self.configs.nsp.routes);
  //初始化 path 存放根路径
  self.path = self.server.resolvePath(self.configs.nsp.path || './');
  self.generator = self.server.require("$./core/generator");
};

//处理请求
Handler.prototype.handle = function(context) {
  var self = this;
  context.request.form = context.request.form || {};
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
  context.request.physicalPathExists(function(exists) {
    if (exists) {
      // nsp 只允许 get 和 post 请求
      if (ALLOWED_METHODS.indexOf(context.request.method) < 0) {
        context.notAllowed();
        return;
      }
      var templatePath = context.request.physicalPath;
      var presenterPath = templatePath + '.js';
      if (PresenterCache[presenterPath]) {
        var Presenter = PresenterCache[presenterPath];
        self.handleByPresenter(context, Presenter, templatePath);
        return;
      }
      fs.exists(presenterPath, function(exists) {
        var Presenter = exists ? require(presenterPath) : DefaultPresenter;
        self.generator.wrap(Presenter.prototype);
        PresenterCache[presenterPath] = Presenter;
        self.handleByPresenter(context, Presenter, templatePath);
      });
    } else {
      self.next(context);
    }
  });
};

Handler.prototype.handlePostBack = function(context, presenter) {
  var self = this;
  presenter.el = {};
  //
  var stateText = context.request.form[HIDDEN_STATE];
  if (stateText) {
    context.isPostBack = true;
    var stateContent = base64.decode(stateText);
    var $ = cheerio.load(stateContent, { decodeEntities: false });
    var stateElements = $("[" + SERVER_ID_NAME + "]");
    self.utils.each(stateElements, function(i, _stateElement) {
      var stateElement = $(_stateElement);
      var serverId = stateElement.attr(SERVER_ID_NAME);
      presenter.el[serverId] = stateElement;
      presenter[serverId] = presenter[serverId] || presenter.el[serverId];
    });
  } else {
    context.isPostBack = false;
    //TODO: load 不能访问服务端元素，如果想访问，需要模块文件中，提取出来。
  }
};

//处理
Handler.prototype.handleByPresenter = function(context, Presenter, templatePath) {
  var self = this;
  context.shouldCompress = self.configs.nsp.compress;
  context.shouldCache = self.configs.nsp.cache;
  var presenter = new Presenter(self.server);
  presenter.context = context;
  presenter.session = context.session;
  presenter.server = context.server;
  presenter.response = context.response;
  presenter.request = context.request;
  presenter.locale = context.locale;
  //处理视图状态
  self.handlePostBack(context, presenter);
  //如果没有load方法，则创建一个默认的 load 方法
  presenter.load = presenter.load || function(_context) {
    var _presenter = this;
    _presenter.render();
  };
  //调用绑定方法
  var _method = context.request.form[HIDDEN_METHOD] || 'load';
  var _args = JSON.parse(context.request.form[HIDDEN_ARGS] || '[]');
  if (!presenter[_method]) {
    context.error('The method "' + _method + '" not found');
  }
  //页面呈现方法
  presenter.render = function() {
    //在 nsp 的模板中 this 指向 presenter
    var content = self.viewEngine.executeFile(templatePath, presenter, {
      "extend": {
        "self": presenter,
        "context": context,
        "locale": context.locale,
        "server": context.server,
        "session": context.session
      }
    });
    self.send(context, presenter, content);
  };
  //准备就绪方法，此方法将触发 method 的调用
  //如果定义了 init 方法，需要手动调用 ready
  self.utils.defineOnceFunc(presenter, 'ready', function(err) {
    if (err) {
      return context.error(err);
    }
    //防止重复调用结束
    var ps = presenter[_method].apply(presenter, _args);
    self.utils.checkPromise(ps, context.error);
  });
  //--
  context.filterInvoker.invoke('onNspHandle', context, function(err) {
    if (err) {
      return context.error(err);
    }
    //调用 init 方法
    if (presenter.init) {
      var ps = presenter.init(context, presenter.ready);
      self.utils.checkPromise(ps, context.error);
    } else {
      presenter.ready();
    }
  });
};

Handler.prototype.send = function(context, presenter, content) {
  var self = this;
  if (self.utils.isNull(content) || content === '') {
    context.send(content);
    return;
  }
  var $ = cheerio.load(content, { decodeEntities: false });
  var head = $('head');
  if (head && head.append) {
    head.append(CLIENT_SCRIPT);
    self.utils.each(presenter.el, function(serverId, stateElement) {
      if (!stateElement || !stateElement[0] || stateElement[0].parent) {
        return;
      }
      var element = $('[' + SERVER_ID_NAME + '="' + serverId + '"]');
      if (element && stateElement) {
        element.replaceWith(stateElement);
      }
    });
    context.send($.html());
  } else {
    context.send(content);
  }
};
/*end*/