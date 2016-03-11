/**
 * 定义 IndexPresenter
 **/
var IndexPresenter = module.exports = function() { };

/**
 * 初始化 IndexPresenter
 **/
IndexPresenter.prototype.init = function() {
  var self = this;
  self.name = 'NSP';
  self.ready();
};

/**
 * load 事件处理方法
 **/
IndexPresenter.prototype.load = function() {
  var self = this;
  self.render();
};