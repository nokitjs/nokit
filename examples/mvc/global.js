var Global = module.exports = function(){};

Global.prototype.onStart = function(server, done) {
    done();
};

Global.prototype.onStop = function(server, done) {
    done();
};

Global.prototype.onError = function(context, done) {
    done();
};

Global.prototype.onRequestBegin = function(context, done) {
    done();
};

Global.prototype.onReceived = function(context, done) {
    done();
};

Global.prototype.onResponse = function(context, done) {
    done();
};

Global.prototype.onRequestEnd = function(context, done) {
    done();
};