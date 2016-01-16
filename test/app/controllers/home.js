/**
 * 定义 HomeController
 **/
var HomeController = module.exports = function () { };

/**
 * indexAction
 **/
HomeController.prototype.index = function () {
    var self = this;
    self.render("home", {
        "name": "MVC"
    });
};

HomeController.prototype.say = function () {
    var self = this;
    self.context.send(self.context.params("name"));
};