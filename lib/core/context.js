/**
 * http 请求上下文对象
 */
var Context = function(server, req, res) {
    var self = this;
    self.server = server;
    self.request = req;
    self.response = res;
    self.configs = server.configs;
    self.utils = self.server.require('./core/utils');
    self.hookResponseEnd();
};

Context.prototype.hookResponseEnd = function() {
    var self = this;
    self.response.__end = self.response.end;
    self.response.end = function() {
        if (self.isEnd) return;
        var res = this;
        res.__end.apply(res, arguments);
        if (self.server.logger && self.server.logger.writeBuffer) {
            self.server.logger.writeBuffer();
        }
        self.isEnd = true;
    };
};

Context.prototype.data = function(name) {
    var self = this;
    return self.request.queryData[name] || self.request.formData[name];
};

Context.prototype.responseError = function(errorMessage) {
    var self = this;
    self.server.logger.log(errorMessage);
    self.response.writeHead(500, {
        'Content-Type': self.configs.mimeType['.html']
    });
    var model = {
        errorMessage: errorMessage,
        server: self.server,
        context: self,
        request: self.request,
        response: self.response
    };
    self.response.end(self.server.responsePages["500"](model));
};

Context.prototype.responseNotFound = function() {
    var self = this;
    self.response.writeHead(404, {
        'Content-Type': self.configs.mimeType['.html']
    });
    var model = {
        server: self.server,
        context: self,
        request: self.request,
        response: self.response
    };
    self.response.end(self.server.responsePages["404"](model));
};

Context.prototype.responseDeny = function() {
    var self = this;
    self.response.writeHead(405, {
        'Content-Type': self.configs.mimeType['.html']
    });
    var model = {
        server: self.server,
        context: self,
        request: self.request,
        response: self.response
    };
    self.response.end(self.server.responsePages["405"](model));
};

Context.prototype.canCache = function() {
    var self = this;
    var url = self.request.withoutQueryStringURL;
    return self.utils.each(self.configs.caches, function(i, rule) {
        var exp = new RegExp(rule);
        if (exp.test(url)) {
            return true;
        }
    });
};

Context.prototype.responseContent = function(content, mime, disCache) {
    var self = this;
    mime = mime || self.request.mime;
    self.response.writeHead(200, {
        'Content-Type': mime
    });
    //处理缓存开始
    if (!disCache && self.canCache()) {
        self.server.cache[self.request.withoutQueryStringURL] = {
            "content": content,
            "mime": mime
        };
    }
    //处理缓存结束
    self.response.end(content);
};

Context.prototype.redirect = function(url) {
    var self = this;
    self.response.writeHead(302, {
        'Location': url
    });
    self.response.end();
};

module.exports = Context;
/*end*/