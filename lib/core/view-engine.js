var fs = require("fs");
var path = require("path");
var tp = require('tpjs');
var utils = require('./utils');

/**
 * 视图引擎
 * ViewEngine
 **/
var ViewEngine = module.exports = function(server) {
  var self = this;
  self.server = server;
  self.configs = server.configs.viewEngine;
  self._cache = {};
  self.extend = {};
};

/**
 * 处理 view 路径
 **/
ViewEngine.prototype._handlePath = function(viewPath) {
  var self = this;
  if (viewPath && viewPath.indexOf('.') < 0) {
    return viewPath + self.configs.extname || ".html";
  } else {
    return viewPath;
  }
};

/**
 * 创建模板扩展对象
 **/
ViewEngine.prototype._createExtendObject = function(options) {
  var self = this;
  options = options || {};
  var extObj = {};
  //处理相对路径
  extObj.resolvePath = function(_path) {
    return path.resolve(path.dirname(options.viewPath), _path);
  };
  //为模板添 require 方法，用于引入 js 模块
  extObj.require = function(_path) {
    var $ = this;
    try {
      return require(_path);
    } catch (ex) {
      var resolvePath = $.resolvePath(_path);
      return require(resolvePath);
    }
  };
  //视图包含，在视图中包含其它视图
  extObj.include = function(_path) {
    var $ = this;
    var resolvePath = $.resolvePath(_path);
    var content = self.executeFile(resolvePath, $.model, $.__options);
    $(content);
  };
  //声明模板使用那一个母板页
  extObj.master = extObj.extends = function(_path) {
    var $ = this;
    $.__master = $.resolvePath(_path);
  };
  //定义一个占位符
  extObj.placeholder = extObj.placeHolder = extObj.defineBlock = function(name) {
    var $ = this;
    if ($.model && $.model.__place_content && $.model.__place_content[name]) {
      $($.model.__place_content[name].join("") || "");
    }
  };
  //开始一个 block
  extObj.beginContent = extObj.placeBegin = extObj.beginBlock = function(name) {
    var $ = this;
    $.__old_push = $.push;
    $.__place_content = $.__place_content || {};
    $.__place_content[name] = $.__place_content[name] || [];
    $.push = function(text) {
      $.__place_content[name].push(text);
    };
  };
  //结束一个 block
  extObj.endContent = extObj.placeEnd = extObj.endBlock = function() {
    var $ = this;
    if ($.__old_push) {
      $.push = $.__old_push;
      $.__old_push = null;
    }
  };
  //定义或结束一个 block
  extObj.content = extObj.block = function(name) {
    var $ = this;
    if (name) {
      $.beginContent(name);
    } else {
      $.endContent();
    }
  };
  //将 utils 扩展到模板
  utils.copy(utils, extObj);
  //将 ViewEngine.extend 扩展到模板
  utils.copy(self.extend, extObj);
  //将 ptions.extend 扩展到模板
  if (options.extend) {
    utils.copy(options.extend, extObj);
  }
  //----
  return extObj;
};

//执行一个模板
ViewEngine.prototype._executeView = function(view, model, options) {
  var self = this;
  options = options || {};
  options.returnHandler = true;
  options.extend = options.extend || {};
  options.extend.__options = options;
  model = model || {};
  var viewHanlder = view(model, options);
  //如果存在母板页
  if (viewHanlder.__master) {
    model.__place_content = viewHanlder.__place_content;
    var result = self.executeFile(viewHanlder.__master, model, options);
    return result;
  } else {
    return viewHanlder.result || viewHanlder;
  }
};

//编译一段文本
ViewEngine.prototype.compileText = function(viewText, options) {
  var self = this;
  //编译
  options = options || {};
  options.extend = self._createExtendObject(options);
  var view = tp.compile(viewText, options);
  return view;
};

//执行一段文本
ViewEngine.prototype.executeText = function(viewText, model, options) {
  var view = self.compileText(viewText, options);
  if (view == null) return;
  return self._executeView(view, model, options);
};

//编译一个模板
ViewEngine.prototype.compileFile = function(viewPath, options) {
  var self = this;
  viewPath = self._handlePath(viewPath);
  //检查缓存
  if (self._cache[viewPath]) {
    return self._cache[viewPath];
  }
  options = options || {};
  options.viewPath = viewPath;
  var buffer = fs.readFileSync(viewPath) || "";
  var view = self.compileText(buffer.toString(), options);
  self._cache[viewPath] = view;
  return view;
};

//执行一个模板文件
ViewEngine.prototype.executeFile = function(viewPath, model, options) {
  var self = this;
  var view = self.compileFile(viewPath);
  if (view == null) return;
  return self._executeView(view, model, options);
};

//end