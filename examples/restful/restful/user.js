function User() {};

User.prototype.get = function(out) {
    var self = this;
    out("Hello By get，" + self.context.routeData["userId"]);
};

module.exports = User;