function User() {};

User.prototype.post = function() {
    var self = this;
    var context = self.context;
    var req = self.context.request;
    req.body = req.body || {};
    req.body.welcome = "Welcome to Nokit REST, By GET, routeData:" + context.routeData["userId"];
    req.body.user = ["张三", "李四"];
    req.body.obj = {
        "name": "test"
    };
    self.out(req.body);
};

User.prototype.get = function() {
    var self = this;
    var context = self.context;
    var req = self.context.request;
    req.body = req.body || {};
    req.body.welcome = "Welcome to Nokit REST, By GET, routeData:" + context.routeData["userId"];
    req.body.user = ["张三", "李四"];
    req.body.obj = {
        "name": "test"
    };
    self.out(req.body);
};

module.exports = User;