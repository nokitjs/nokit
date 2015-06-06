function User() {};

User.prototype.post = function() {
    var self = this;
    self.out("By POST，" + self.context.routeData["userId"]);
};

User.prototype.get = function() {
    var self = this;
    self.out("By GET，" + self.context.routeData["userId"]);
};

module.exports = User;