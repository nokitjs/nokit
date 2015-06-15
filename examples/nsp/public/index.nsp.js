var Index = module.exports = function() {};

Index.prototype.init = function() {
    var self = this;
    self.name = 'Nokit NSP';
};

Index.prototype.load = function(context) {
    var self = this;
    self.render();
};

Index.prototype.add = function(context) {
    var self = this;
    var val = parseInt(self.aumBox.val());
    self.box.find('[nsp-id="aumBox"]').css("padding","20px");
    self.aumBox.val(++val);
    self.aumBox.css("border","solid 1px red");
    self.render();
};