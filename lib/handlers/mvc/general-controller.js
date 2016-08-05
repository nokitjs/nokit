/**
 * 默认 Controller 
 * 路由设置时如果直接指定 view，将使用些 Controller 去 render view
 **/
const GeneralController = function () { };

/**
 * 默认 action
 * 呈现 self.view 
 **/
GeneralController.prototype.index = function () {
  var self = this;
  self.render(self.view);
};

module.exports = GeneralController;