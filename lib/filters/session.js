var SESSION_ID_NAME = 'NSID';

/**
 * 定义 SessionFilter
 **/
var SessionFilter = module.exports = function (server) {
	var self = this;
	self.server = server;
	self.configs = server.configs.session;
	self.utils = server.require("$./core/utils");
	//声明为并行 filter
	self.parallel = true;
};

/**
 * 处理 sessionId
 **/
SessionFilter.prototype._handleSessionId = function (context) {
    var self = this;
    if (!self.configs.state) {
        return;
    }
    var req = context.request,
        res = context.response;
    context.sessionId = req.cookie.get(SESSION_ID_NAME);
    if (!context.sessionId) {
        context.sessionId = self.utils.newGuid().split('-').join('');
        res.cookie.add(SESSION_ID_NAME, context.sessionId, {
            "httpOnly": true,
            "secure": self.configs.https
        });
    }
};

/**
 * 存储就绪
 **/
SessionFilter.prototype._storeReady = function (callback) {
	var self = this;
	if (self._storeReadyed) {
		if (callback) callback();
		return;
	}
	var Store = self.server.require(self.configs.provider);
	self.store = new Store(self.server);
	self.store.init(self.configs, function () {
		self._storeReadyed = true;
		if (callback) callback();
	});
};

/**
 * 在请求开始时
 **/
SessionFilter.prototype.onRequestBegin = function (context, next) {
	var self = this;
	if (!self.configs.state) {
        return next();
    }
	self._handleSessionId(context);
	self._storeReady(function () {
		self.store.load(context.sessionId, function (obj) {
			context.session = obj;
			next();
		});
	});
};

/**
 * 在请求结束时
 **/
SessionFilter.prototype.onRequestEnd = function (context, next) {
	var self = this;
	if (!self.configs.state) {
        return next();
    }
	self._storeReady(function () {
		self.store.save(context.sessionId, context.session, next);
	});
};
