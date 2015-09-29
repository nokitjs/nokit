var Index = module.exports = function () { };

Index.prototype.init = function () {
    var self = this;
    self.name = 'Nokit NSP';
    self.ready();
};

Index.prototype.load = function () {
    var self = this;
    self.render();
};

Index.prototype.add = function (name) {
    var self = this;
    var val = parseInt(self.numBox.val());
    self.numBox.val(++val);
    self.numBox.css("border", "solid 1px red");
    self.abc.val(self.abc.val() + name);
    self.render();
};