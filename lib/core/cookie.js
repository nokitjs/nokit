var utils = require('./utils');
var console = require('./console');

/**
 * 定义 Cookie 类
 **/
function Cookie(context, options) {
    var self = this;
    self._init(context, options);
};

/**
 * 定义 Cookie Type 常量
 **/
Cookie.TYPE_REQUEST = 'req';
Cookie.TYPE_RESPONSE = 'res';

/**
 * Cookie 初始化
 **/
Cookie.prototype._init = function (context, options) {
    var self = this;
    self.options = options || {};
    self.options.type == self.options.type || Cookie.TYPE_REQUEST;
    self.context = context;
    self.response = context.response;
    self.request = context.request;
    self._cookieTable = {};
    if (self.options.type == Cookie.TYPE_REQUEST) {
        self._parseRequestCookies();
    }
};

/**
 * 解析客户端请求回发来的 Cookie
 **/
Cookie.prototype._parseRequestCookies = function () {
    var self = this;
    //分解http请求内的cookie，其格式为 name=value; name=value; ...
    var cookieContent = (self.request.headers["cookie"] || "").trim();
    utils.each(cookieContent.split(';'), function (i, cookieText) {
        if (!utils.contains(cookieText, '=')) return;
        var cookiePair = cookieText.split('=');
        var name = cookiePair[0].trim();
        var value = cookiePair[1].trim();
        self._cookieTable[name] = {
            "value": value,
            "options": {}
        };
    });
};

/**
 * 添加一个 cookie 
 **/
Cookie.prototype.add = function (name, value, options) {
    var self = this;
    if (self.options.type != Cookie.TYPE_RESPONSE) {
        console.error('非 response.cookie 对象不能进行 add 操作');
        return;
    }
    options = options || {};
    options["path"] = options["path"] || "/";
    self._cookieTable[name] = {
        "value": value,
        "options": options
    };
    self.response.setHeader("Set-Cookie", self.toArray());
};

/**
 * 移除一个 cookie
 **/
Cookie.prototype.remove = function (name) {
    var self = this;
    if (self.options.type != Cookie.TYPE_RESPONSE) {
        console.error('非 response.cookie 对象不能进行 remove 操作');
        return;
    }
    var cookie = self.get(name);
    if (cookie) {
        cookie.options = cookie.options || {};
        cookie.options["Max-Age"] = 0;
        self.response.setHeader("Set-Cookie", self.toArray());
    }
};

/**
 * 获取 Cookie
 **/
Cookie.prototype.get = function (name, returnItem) {
    var self = this;
    var item = self._cookieTable[name];
    if (returnItem) {
        return item;
    } else {
        return (item || {}).value;
    }
};

/**
 * 输出为数组
 **/
Cookie.prototype.toArray = function () {
    var self = this;
    var arrayBuffer = [];
    utils.each(self._cookieTable, function (cookieName, cookie) {
        var cookieBuffer = [cookieName + '=' + cookie.value];
        utils.each(cookie.options, function (optName, optValue) {
            if ((optName == 'httpOnly' || optName == 'secure') &&
                optValue) {
                cookieBuffer.push(optName);
            } else if (!utils.isNull(optValue)) {
                cookieBuffer.push(optName + '=' + optValue);
            }
        });
        arrayBuffer.push(cookieBuffer.join(';'));
    });
    return arrayBuffer;
};

module.exports = Cookie;
/*end*/