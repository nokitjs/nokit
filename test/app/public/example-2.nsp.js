/**
 * ExamplePresenter
 **/
var ExamplePresenter = function() { };

/**
 * 初始化方法，每次请求都会先执行 init 方法
 **/
ExamplePresenter.prototype.init = function() {
  var self = this;
  self.name = "nsp";
  self.ready();
};

/**
 * 默认方法，首次打开页面，会触发 load 方法
 **/
ExamplePresenter.prototype.load = function() {
  var self = this;
  self.render();
};

/**
 * 事件方法，可以绑定到页面中的 html 控件
 **/
ExamplePresenter.prototype.test = function() {
  var self = this;
  self.render();
};

module.exports = ExamplePresenter;

