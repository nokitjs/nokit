var Global = module.exports = function(server) {
    var self = this;
    self.server = server;
};

Global.prototype.onAppStart = function(server, done) {
    done();
};

Global.prototype.onAppStop = function(server, done) {
    done();
};

Global.prototype.onRequestBegin = function(context, done) {
    done();
};

Global.prototype.onRequestEnd = function(context, done) {
    done();
};

Global.prototype.onReceiveBegin = function(context, done) {
    done();
};

Global.prototype.onReceiveEnd = function(context, done) {
    done();
};

Global.prototype.onError = function(context, done) {
    done();
};