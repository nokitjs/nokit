/**
 * 定义 MgrFilter
 **/
var MgrFilter = module.exports = function () { };

/**
 * 在请求到达时
 **/
MgrFilter.prototype.onRequest = function (context, next) {
    context.deny();
};