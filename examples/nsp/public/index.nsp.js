/**
 * 定义 IndexPresenter
 **/
var IndexPresenter = nokit.define({

  /**
   * 初始化 IndexPresenter
   **/
  init: function() {
    var self = this;
    self.name = 'NSP';
    self.ready();
  },

  /**
   * load 事件处理方法
   **/
  load: function() {
    var self = this;
    self.render();
  },

  /**
   * 事件方法，可以绑定到页面中的 html 控件
   **/
  test: function() {
    var self = this;
    self.render();
  }

});

module.exports = IndexPresenter;