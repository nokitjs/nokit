var Home = module.exports = function() {};

Home.prototype.index = function() {
    var self = this;
    self.render("home.html", {
        "name": "Nokit MVC"
    });
};