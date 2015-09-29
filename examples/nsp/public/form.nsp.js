var Form = module.exports = function () { };

Form.prototype.init = function () {
    var self = this;
    self.ready();
};

Form.prototype.load = function () {
    var self = this;
    self.render();
};