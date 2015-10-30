var Task = require('./task');
var utils = require('./utils');

var FilterInvoker = module.exports = function(list) {
    var self = this;
    self.list = list;
    self.invokedMethods = [];
};

FilterInvoker.prototype.invoke = function(method, args, callback) {
    var self = this;
    if (self.invokedMethods.indexOf(method) > -1 || !self.list || self.list.length < 1) {
        if (callback) callback();
        return;
    }
    self.invokedMethods.push(method);
    var task = Task.create();
    utils.each(self.list, function(i, filter) {
        if (filter && filter[method]) {
            task.add(function(done) {
                filter[method](args, done);
            });
        }
    });
    task.seq(callback);
};