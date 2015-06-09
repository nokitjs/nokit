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
};

Context.prototype.data = function(name) {
    var self = this;
    return self.request.queryData[name] || self.request.formData[name];
};

Context.prototype.responseError = function(errorMessage) {
    var self = this;
    if (self.isEnd) return;
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
    self.isEnd = true;
};

Context.prototype.responseNotFound = function() {
    var self = this;
    if (self.isEnd) return;
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
    self.isEnd = true;
};

Context.prototype.responseDeny = function() {
    var self = this;
    if (self.isEnd) return;
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
    self.isEnd = true;
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
    if (self.isEnd) return;
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
    self.isEnd = true;
};

Context.prototype.redirect = function(url) {
    var self = this;
    if (self.isEnd) return;
    self.response.writeHead(302, {
        'Location': url
    });
    self.response.end();
    self.isEnd = true;
};

module.exports = Context;
/*end*/