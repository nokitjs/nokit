var Task = require('./task');
var utils = require('./utils');

var Filers = module.exports = function(list) {
    var self = this;
    self.list = list;
};

Filers.prototype.invoke = function(method, args, callback) {
    var self = this;
    if (!self.list || self.list.length < 1) {
        if (callback) callback();
        return;
    }
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