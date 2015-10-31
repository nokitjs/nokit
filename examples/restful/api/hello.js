/**
 * 定义 HelloController
 **/
var HelloController = module.exports = function User() { };

/**
 * post 处理方法
 **/
HelloController.prototype.post = function () {
    var self = this;
    self.out({
        "status": "success",
        "message": "Hello " + self.context.routeData["name"]
    });
};

/**
 * get 处理方法
 **/
HelloController.prototype.get = function () {
    var self = this;
    self.out({
        "status": "success",
        "message": "Hello " + self.context.routeData["name"]
    });
};
