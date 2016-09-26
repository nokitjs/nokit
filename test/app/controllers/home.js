/**
 * 定义 HomeController
 **/
const HomeController = module.exports = function () { };

HomeController.prototype.init = function () {
  var self = this;
  self.ready();
};

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
  self.context.send(self.context.param("name"), 'text/html');
};

HomeController.prototype.readAndWriteSession = function () {
  var self = this;
  var srcVal = parseInt(self.context.param("val"));
  self.context.session.remove("s", function () {
    self.context.session.set("s", srcVal, function () {
      self.context.session.get("s", function (val) {
        var dstVal = val + val;
        self.context.send(dstVal);
      });
    });
  });
};

HomeController.prototype.status = function () {
  var self = this;
  var statusCode = self.context.params["code"];
  self.context.status(statusCode);
  self.context.send();
};

HomeController.prototype.statusTemplate = function () {
  var self = this;
  var statusCode = self.context.params["code"];
  self.context.statusTemplate(statusCode);
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

HomeController.prototype.redirect = function () {
  var self = this;
  self.context.redirect('/');
};

HomeController.prototype.permanentRedirect = function () {
  var self = this;
  self.context.permanentRedirect('/');
};

HomeController.prototype.notFound = function () {
  var self = this;
  self.context.notFound();
};

HomeController.prototype.forbidden = function () {
  var self = this;
  self.context.forbidden();
};

HomeController.prototype.notAllowed = function () {
  var self = this;
  self.context.notAllowed();
};

HomeController.prototype.transfer = function () {
  var self = this;
  self.context.transfer('/json');
};

HomeController.prototype.noChange = function () {
  var self = this;
  self.context.noChange();
};

HomeController.prototype.emitError = function () {
  var self = this;
  self.__no_func();
};

HomeController.prototype.cookie = function () {
  var self = this;
  var cookieValue = self.context.cookie.get("test");
  self.context.cookie.set("test", "test");
  self.context.cookie.remove("test");
  self.context.cookie.set("test", "test");
  self.context.send(cookieValue, "text/html");
};

HomeController.prototype.buffer = function () {
  var self = this;
  self.context.buffer(new Buffer("test"), "text/html");
};

HomeController.prototype.testRoute = function () {
  var self = this;
  self.context.send(self.context.params['num'], "text/html");
};

var asyncFunc = function (n) {
  return function (callback) {
    setTimeout(function () {
      callback(null, n * n);
    }, 0);
  };
};

HomeController.prototype.generatorAsync = function* () {
  var self = this;
  var n = self.context.param("n");
  var x = yield asyncFunc(10);
  self.context.send(x, "text/html");
};