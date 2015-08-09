var zlib = require("zlib");
var Stream = require('stream');

/**
 * http 请求上下文对象
 */
var Context = function(server, req, res) {
    var self = this;
    self.beginTime = Date.now();
    self.server = server;
    self.request = req;
    self.response = res;
    self.configs = server.configs;
    self.utils = self.server.require('./core/utils');
    self.ignoreHandlers = [];
    self.hookResponse();
};

var CACHE_TYPE_SERVER = 'server';
var CACHE_TYPE_CLIENT = 'client';
var CACHE_DEFAULT_MAX_AGE = 1800;

Context.prototype.hookResponse = function() {
    var self = this;
    self.onEnd = function(callback) {
        if (self.isEnd) return;
        self.filters.invoke('onRequestEnd', self, function() {
            if (callback) callback();
        });
        self.isEnd = true;
        //--
        self.endTime = Date.now();
        if (self.server.logger && self.server.logger.writeBuffer) {
            var ms = self.endTime - self.beginTime;
            self.server.logger.writeBuffer(ms);
        }
    };
    self.response.__end = self.response.end;
    self.response.end = function() {
        if (self.isEnd) return;
        var res = this;
        var args = arguments;
        self.onEnd(function() {
            res.__end.apply(res, args);
        });
    };
    self.response.fromStream = function(stream) {
        if (self.isEnd) return;
        var res = this;
        self.onEnd(function() {
            stream.pipe(res);
            stream.on('end', function() {
                res.__end();
            });
        });
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
    self.routeData = self.routeData || {};
    return self.request.queryData[name] || self.request.formData[name] || self.routeData[name];
};

Context.prototype.responseError = function(err) {
    var self = this;
    var errorMessage = (err.message && err.stack) ? (err.message + "\r\n" + err.stack) : err;
    self.server.logger.error(errorMessage);
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

Context.prototype.responseDeny = function(message) {
    var self = this;
    self.response.writeHead(405, {
        'Content-Type': self.configs.mimeType['.html']
    });
    if (message) {
        self.response.end(message);
    } else {
        var model = {
            server: self.server,
            context: self,
            request: self.request,
            response: self.response
        };
        self.response.end(self.server.responsePages["405"](model));
    }
};

Context.prototype.checkCache = function(type) {
    var self = this;
    if ((self.canServerCache && type == CACHE_TYPE_SERVER) ||
        (self.canClientCache && type == CACHE_TYPE_CLIENT)) {
        return true;
    }
    self.configs.cache = self.configs.cache || {};
    self.configs.cache[type] = self.configs.cache[type] || {};
    var url = self.request.withoutQueryStringURL;
    return self.utils.each(self.configs.cache[type].match, function(i, rule) {
        var exp = new RegExp(rule);
        if (exp.test(url)) {
            return true;
        }
    });
};

Context.prototype.checkCompress = function() {
    var self = this;
    if (self.canCompress) {
        return true;
    }
    self.configs.compress = self.configs.compress || [];
    var url = self.request.withoutQueryStringURL;
    return self.utils.each(self.configs.compress, function(i, rule) {
        var exp = new RegExp(rule);
        if (exp.test(url)) {
            return true;
        }
    });
};

Context.prototype.responseStream = function(contentStream, mime) {
    var self = this;
    self.response.mime = mime || self.request.mime;
    self.response.contentStream = contentStream;
    self.filters.invoke('onResponse', self, function() {
        //处理客户端缓存开始
        if (self.checkCache(CACHE_TYPE_CLIENT)) {
            var maxAge = self.configs.cache.client.maxAge || CACHE_DEFAULT_MAX_AGE;
            var expires = new Date();
            expires.setTime(expires.getTime() + maxAge * 1000);
            self.response.setHeader("Expires", expires.toUTCString());
            self.response.setHeader("Cache-Control", "max-age=" + maxAge);
        }
        //处理客户端缓存结束
        var canCompress = self.checkCompress();
        var acceptEncoding = self.request.headers['accept-encoding'] || "";
        var gzip = acceptEncoding.match(/\bgzip\b/);
        var deflate = acceptEncoding.match(/\bdeflate\b/);
        if (canCompress && gzip && gzip.length > 0) {
            //gzip
            self.response.writeHead(200, {
                'Content-Type': self.response.mime,
                'Content-Encoding': 'gzip'
            });
            var compressStream = self.response.contentStream.pipe(zlib.createGzip());
            self.response.fromStream(compressStream);
        } else if (canCompress && deflate && deflate.length > 0) {
            //deflate
            self.response.writeHead(200, {
                'Content-Type': self.response.mime,
                'Content-Encoding': 'deflate'
            });
            var compressStream = self.response.contentStream.pipe(zlib.createDeflate());
            self.response.fromStream(compressStream);
        } else {
            //stream
            self.response.writeHead(200, {
                'Content-Type': self.response.mime
            });
            self.response.fromStream(self.response.contentStream);
        }

    });
};

Context.prototype.responseContent = function(content, mime) {
    var self = this;
    self.response.mime = mime || self.request.mime;
    var isStream = (content instanceof Stream);
    if (isStream) {
        self.responseStream(content, mime);
    } else {
        self.response.content = content;
        //处理服务器端缓存开始
        if (self.checkCache(CACHE_TYPE_SERVER)) {
            self.server.cache[self.request.withoutQueryStringURL] = {
                "content": self.response.content,
                "mime": self.response.mime
            };
        }
        //处理服务器端缓存结束

        //转换为流
        var contentStream = new Stream.Readable();
        contentStream.push(content);
        contentStream.push(null);
        self.responseStream(contentStream, mime);
    }
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