/**
 * 定义 HomeController
 **/
var HomeController = module.exports = function () { };

/**
 * indexAction
 **/
HomeController.prototype.index = function () {
    var self = this;
    self.render("home.html", {
        "name": "MVC"
    });
};