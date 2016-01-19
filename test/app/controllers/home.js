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

HomeController.prototype.readAndWriteSession = function () {
    var self = this;
    var srcVal = parseInt(self.context.params("val"));
    self.context.session.set("s", srcVal, function () {
        self.context.session.get("s", function (val) {
            var dstVal = val + val;
            self.context.send(dstVal);
        });
    });
};

HomeController.prototype.status = function () {
    var self = this;
    var statusCode = self.context.routeData["code"];
    self.context.status(statusCode);
};

HomeController.prototype.statusWithContent = function () {
    var self = this;
    var statusCode = self.context.routeData["code"];
    self.context.statusWithContent(statusCode);
};

HomeController.prototype.localeAction = function () {
    var self = this;
    self.render('locale');
};

HomeController.prototype.json = function () {
    var self = this;
    self.context.json('json');
};

HomeController.prototype.jsonp = function () {
    var self = this;
    self.context.jsonp('jsonp');
};