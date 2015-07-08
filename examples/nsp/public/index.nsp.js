var Index = module.exports = function() {};

Index.prototype.init = function(context) {
    var self = this;
    self.name = 'Nokit NSP';
};

Index.prototype.load = function(context) {
    var self = this;
    self.render();
};

Index.prototype.add = function(context) {
    var self = this;
    var val = parseInt(self.numBox.val());
    self.numBox.val(++val);
    self.numBox.css("border","solid 1px red");
    self.render();
};