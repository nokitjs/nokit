/**
 * 定义 MgrFilter
 **/
var MgrFilter = module.exports = function () { };

/**
 * 在请求结束时
 **/
MgrFilter.prototype.onRequestEnd = function (context, next) {
    context.deny();
};