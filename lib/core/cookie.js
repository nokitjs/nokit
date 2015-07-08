var utils = require('./utils');
var console = require('./console');

function Cookie(options) {
    var self = this;
    self.options = options || {};
    self.options.content = (self.options.content || "").trim();
    self.response = self.options.response;
    self.cookieTable = {};
    //分解http请求内的cookie，其格式为 name=value; name=value; ...
    if (self.options.content) {
        utils.each(self.options.content.split(';'), function(i, cookieText) {
            if (!utils.contains(cookieText, '=')) return;
            var cookiePair = cookieText.split('=');
            var name = cookiePair[0].trim();
            var value = cookiePair[1].trim();
            self.cookieTable[name] = {
                "value": value,
                "options": {}
            };
        });
    }
};

Cookie.prototype.add = function(name, value, options) {
    var self = this;
    if (self.response == null) {
        console.error('非 response.cookie 对象不能进行 add 操作');
        return;
    }
    options = options || {};
    options["path"] = options["path"] || "/";
    self.cookieTable[name] = {
        "value": value,
        "options": options
    };
    self.response.setHeader("Set-Cookie", self.toArray());
};

Cookie.prototype.remove = function(name) {
    var self = this;
    if (self.response == null) {
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

Cookie.prototype.get = function(name, returnItem) {
    var self = this;
    var item = self.cookieTable[name];
    if (returnItem) {
        return item;
    } else {
        return (item || {}).value;
    }
};

Cookie.prototype.toArray = function() {
    var self = this;
    var arrayBuffer = [];
    utils.each(self.cookieTable, function(cookieName, cookie) {
        var cookieBuffer = [cookieName + '=' + cookie.value];
        utils.each(cookie.options, function(optName, optValue) {
            cookieBuffer.push(optName + '=' + optValue)
        });
        arrayBuffer.push(cookieBuffer.join(';'));
    });
    return arrayBuffer;
};

module.exports = Cookie;
/*end*/