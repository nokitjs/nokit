/**
 * 全局应用程序类
 **/
const TestFilter = function () { };


/**
 * 在请求发生异常时
 **/
TestFilter.prototype.onError = function (context, done) {
    done();
};

/**
 * 在请求到达时
 **/
TestFilter.prototype.onRequest = function (context, done) {
    context.__t1 = "1";
    done();
};

/**
 * 在收到请求数据时
 **/
TestFilter.prototype.onReceived = function (context, done) {
    context.__t1 += "2";
    done();
};

/**
 * 在发送响应时
 **/
TestFilter.prototype.onResponse = function (context, done) {
    context.__t1 += "3";
    context.send(context.__t1);
};

/**
 * export
 **/
module.exports = TestFilter;