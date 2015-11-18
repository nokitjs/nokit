/**
 * http 到 https 跳转的 filter
 **/
var HttpToHttpsFilter = function () {
	var self = this;
	//声明为 “并行filter”
	self.parallel = true;
};

/**
 * 在请求开始时
 **/
HttpToHttpsFilter.prototype.onRequestBegin = function (context, next) {
	var url = context.request.url;
	var host = context.request.clientInfo.host;
	var port = context.configs.httpsPort;
	if (port == 443) {
		context.redirect("https://" + host + url); 
	} else {
		context.redirect("https://" + host + ":" + port + url);
	}
};

module.exports = HttpToHttpsFilter;