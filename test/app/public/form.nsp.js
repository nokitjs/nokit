/**
 * 定义 FormPresenter
 **/
var FormPresenter = module.exports = function() { };

/**
 * 初始化 IndexPresenter
 **/
FormPresenter.prototype.init = function() {
  var self = this;
  self.name = 'NSP';
  self.ready();
};

/**
 * load 事件处理方法
 **/
FormPresenter.prototype.load = function() {
  var self = this;
  self.render();
};

FormPresenter.prototype.add = function(t) {
  var self = this;
  self.box.val(Number(self.box.val()) + t);
  self.render();
};