var FilerInvoker = module.exports = function(context, filters) {
    var self = this;
    self.filters = filters;
};

FilerInvoker.prototype.invoke = function(method, callback) {

    if (callback) callback();
};