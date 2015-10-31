/**
 * 全局应用程序类
 **/
var Global = module.exports = function () { };

/**
 * 在应用启动时
 **/
Global.prototype.onStart = function (server, done) {
    done();
};

/**
 * 在应用停止时
 **/
Global.prototype.onStop = function (server, done) {
    done();
};

/**
 * 在应用程序出错时
 **/
Global.prototype.onError = function (context, done) {
    done();
};

/**
 * 在请求开始时
 **/
Global.prototype.onRequestBegin = function (context, done) {
    done();
};

/**
 * 在请求结束时
 **/
Global.prototype.onRequestEnd = function (context, done) {
    done();
};

/**
 * 在收到请求数据时
 **/
Global.prototype.onReceived = function (context, done) {
    done();
};

/**
 * 在响应用时
 **/
Global.prototype.onResponse = function (context, done) {
    done();
};