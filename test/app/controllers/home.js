/**
 * 定义 HomeController
 **/
const HomeController = module.exports = function () { };

HomeController.prototype.init = function () {
  const self = this;
  self.ready();
};

/**
 * indexAction
 **/
HomeController.prototype.index = function () {
  const self = this;
  self.render("home", {
    "name": "MVC"
  });
};

HomeController.prototype.say = function () {
  const self = this;
  self.context.send(self.context.param("name"), 'text/html');
};

HomeController.prototype.readAndWriteSession = function () {
  const self = this;
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
  const self = this;
  var statusCode = self.context.params["code"];
  self.context.status(statusCode);
  self.context.send();
};

HomeController.prototype.statusTemplate = function () {
  const self = this;
  var statusCode = self.context.params["code"];
  self.context.statusTemplate(statusCode);
};

HomeController.prototype.localeAction = function () {
  const self = this;
  self.render('locale');
};

HomeController.prototype.json = function () {
  const self = this;
  self.context.json('json');
};

HomeController.prototype.jsonp = function () {
  const self = this;
  self.context.jsonp('jsonp');
};

HomeController.prototype.redirect = function () {
  const self = this;
  self.context.redirect('/');
};

HomeController.prototype.permanentRedirect = function () {
  const self = this;
  self.context.permanentRedirect('/');
};

HomeController.prototype.notFound = function () {
  const self = this;
  self.context.notFound();
};

HomeController.prototype.forbidden = function () {
  const self = this;
  self.context.forbidden();
};

HomeController.prototype.notAllowed = function () {
  const self = this;
  self.context.notAllowed();
};

HomeController.prototype.transfer = function () {
  const self = this;
  self.context.transfer('/json');
};

HomeController.prototype.noChange = function () {
  const self = this;
  self.context.noChange();
};

HomeController.prototype.emitError = function () {
  const self = this;
  self.__no_func();
};

HomeController.prototype.cookie = function () {
  const self = this;
  var cookieValue = self.context.cookie.get("test");
  self.context.cookie.set("test", "test");
  self.context.cookie.remove("test");
  self.context.cookie.set("test", "test");
  self.context.send(cookieValue, "text/html");
};

HomeController.prototype.buffer = function () {
  const self = this;
  self.context.buffer(new Buffer("test"), "text/html");
};

HomeController.prototype.testRoute = function () {
  const self = this;
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
  const self = this;
  var n = self.context.param("n");
  var x = yield asyncFunc(10);
  self.context.send(x, "text/html");
};