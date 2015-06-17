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
    self.hookResponse();
};

Context.prototype.hookResponse = function() {
    var self = this;
    self.response.__end = self.response.end;
    self.response.end = function() {
        if (self.isEnd) return;
        var res = this;
        var args = arguments;
        if (self.server.logger && self.server.logger.writeBuffer) {
            self.server.logger.writeBuffer();
        }
        self.filters.invoke('onRequestEnd', self, function() {
            res.__end.apply(res, args);
        });
        self.isEnd = true;
    };
    self.response.__writeHead = self.response.writeHead;
    self.response.writeHead = function() {
        if (self.isEnd) return;
        var res = this;
        var args = arguments;
        res.__writeHead.apply(res, args);
    };
    self.response.__setHeader = self.response.setHeader;
    self.response.setHeader = function() {
        if (self.isEnd) return;
        var res = this;
        var args = arguments;
        res.__setHeader.apply(res, args);
    };
};

Context.prototype.data = function(name) {
    var self = this;
    return self.request.queryData[name] || self.request.formData[name];
};

Context.prototype.responseError = function(errorMessage) {
    var self = this;
    self.server.logger.log(errorMessage);
    self.errorMessage = errorMessage;
    self.filters.invoke('onError', self, function() {
        self.response.writeHead(500, {
            'Content-Type': self.configs.mimeType['.html']
        });
        var model = {
            errorMessage: self.errorMessage,
            server: self.server,
            context: self,
            request: self.request,
            response: self.response
        };
        self.response.end(self.server.responsePages["500"](model));
    });
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
    self.response.mime = mime || self.request.mime;
    self.response.content = content;
    self.filters.invoke('onResponse', self, function() {
        self.response.writeHead(200, {
            'Content-Type': self.response.mime
        });
        //处理缓存开始
        if (!disCache && self.canCache()) {
            self.server.cache[self.request.withoutQueryStringURL] = {
                "content": self.response.content,
                "mime": self.response.mime
            };
        }
        //处理缓存结束
        self.response.end(self.response.content);
    });
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