/**
 * 定义 LogFilter 
 **/
var LogFilter = module.exports = function (server) {
	var self = this;
	//声明为并行 filter
	self.parallel = true;
};

/**
 * 在请求开始时
 **/
LogFilter.prototype.onRequestBegin = function (context, next) {
	var self = this;
	next();
};