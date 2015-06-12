function User() {};

User.prototype.post = function() {
    var self = this;
    self.out("Welcome to Nokit REST, By POST, routeData:" + self.context.routeData["userId"]);
};

User.prototype.get = function() {
    var self = this;
    self.out("Welcome to Nokit REST, By GET, routeData:" + self.context.routeData["userId"]);
};

module.exports = User;