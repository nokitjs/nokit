var Filter = module.exports = function (server) {
	var self = this;
	//声明为并行 filter
	self.parallel = true;
};

Filter.prototype.onRequestBegin = function (context, next) {
	var self = this;
	next();
};