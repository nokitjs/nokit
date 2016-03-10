/**
 * 定义 HelloController
 **/
var HelloController = module.exports = function () { };

/**
 * post 处理方法
 **/
HelloController.prototype.post = function () {
    var self = this;
    self.send({
        "status": "success",
        "message": "Hello " + self.context.params["name"] + "!"
    });
};

/**
 * get 处理方法
 **/
HelloController.prototype.get = function () {
    var self = this;
    self.send({
        "status": "success",
        "message": "Hello " + self.context.params["name"] + "!"
    });
};

/**
 * put 处理方法
 **/
HelloController.prototype.put = function () {
    var self = this;
    self.send({
        "status": "success",
        "message": "Hello " + self.context.params["name"] + "!"
    });
};
