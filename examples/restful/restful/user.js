function User() {};

User.prototype.post = function(out) {
    var self = this;
    out("By POST，" + self.context.routeData["userId"]);
};

User.prototype.get = function(out) {
    var self = this;
    out("By GET，" + self.context.routeData["userId"]);
};

module.exports = User;