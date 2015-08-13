var zlib = require("zlib");
var Stream = require('stream');
var utils = require('./utils');
var tp = require('tpjs');

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
    self.configs.cache = self.configs.cache || {};
    self.configs.cache.client = self.configs.cache.client || {};
    self.configs.compress = self.configs.compress || [];
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

Context.prototype.responseTemplate = function(template, model, mime, statusCode, headers) {
    var self = this;
    var templateFunc = utils.isFunction(template) ? template :
        self.server.templatePages[template];
    var contentBuffer = templateFunc ? templateFunc(model) : null;
    self.canCompress = self.configs.template.compress;
    self.responseContent(contentBuffer, mime, statusCode, headers);
};

Context.prototype.responseStatusWithContent = function(statusCode, options, headers) {
    var self = this;
    options = options || {};
    if (utils.isString(options)) {
        options = {
            "template": options
        };
    }
    var mime = self.configs.mimeType['.html'];
    var template = options.template ?
        (utils.isFunction(options.template) ? options.template : tp.compile(options.template)) :
        statusCode;
    var model = options.model || {};
    model.context = self;
    model.server = self.server;
    model.request = self.request;
    model.response = self.response;
    self.responseTemplate(template, model, mime, statusCode, headers);
};

Context.prototype.responseError = function(err, template) {
    var self = this;
    var errorMessage = (err.message && err.stack) ? (err.message + "\r\n" + err.stack) : err;
    self.server.logger.error(errorMessage);
    self.errorMessage = errorMessage;
    self.filters.invoke('onError', self, function() {
        self.responseStatusWithContent(500, {
            "template": template,
            "model": {
                "errorMessage": self.errorMessage
            }
        });
    });
};

Context.prototype.responseNotFound = function(template) {
    var self = this;
    self.responseStatusWithContent(404, {
        "template": template
    });
};

Context.prototype.responseDeny = function(template) {
    var self = this;
    self.responseStatusWithContent(403, {
        "template": template
    });
};

Context.prototype.checkCache = function(type) {
    var self = this;
    var url = self.request.withoutQueryStringURL;
    return self.utils.each(self.configs.cache.client.match, function(i, rule) {
        var exp = new RegExp(rule);
        if (exp.test(url)) {
            return true;
        }
    });
};

Context.prototype.checkCompress = function() {
    var self = this;
    if (!utils.isNull(self.canCompress)) {
        return self.canCompress;
    }
    var url = self.request.withoutQueryStringURL;
    return self.utils.each(self.configs.compress, function(i, rule) {
        var exp = new RegExp(rule);
        if (exp.test(url)) {
            return true;
        }
    });
};

Context.prototype.responseStream = function(contentStream, mime, statusCode, headers) {
    var self = this;
    self.response.mime = mime || self.request.mime;
    self.response.contentStream = contentStream;
    self.response.statusCode = statusCode || 200;
    self.filters.invoke('onResponse', self, function() {
        //处理客户端缓存开始
        var maxAge = self.configs.cache.client.maxAge;
        if (maxAge && maxAge > 0 && self.checkCache()) {
            var expires = new Date();
            expires.setTime(expires.getTime() + maxAge * 1000);
            self.response.setHeader("Expires", expires.toUTCString());
            self.response.setHeader("Cache-Control", "max-age=" + maxAge);
        }
        //处理客户端缓存结束
        headers = headers || {};
        headers["Content-Type"] = self.response.mime;
        var responseStream = self.response.contentStream;
        //处理压缩开始
        if (self.response.contentStream != null && self.checkCompress()) {
            var acceptEncoding = self.request.headers['accept-encoding'] || "";
            var gzip = (acceptEncoding.match(/\bgzip\b/) || [])[0];
            var deflate = (acceptEncoding.match(/\bdeflate\b/))[0];
            headers['Content-Encoding'] = gzip || deflate;
            if (gzip) {
                responseStream = self.response.contentStream.pipe(zlib.createGzip());
            } else if (deflate) {
                responseStream = self.response.contentStream.pipe(zlib.createDeflate());
            }
        }
        //处理压缩结束
        self.response.writeHead(self.response.statusCode, headers);
        if (responseStream != null) {
            self.response.fromStream(responseStream);
        } else {
            self.response.end();
        }
    });
};

Context.prototype.responseContent = function(content, mime, statusCode, headers) {
    var self = this;
    var isStream = (content instanceof Stream);
    if (isStream || utils.isNull(content)) {
        self.responseStream(content, mime, statusCode, headers);
    } else {
        //转换为流
        var contentStream = new Stream.Readable();
        contentStream.push(content);
        contentStream.push(null);
        self.responseStream(contentStream, mime, statusCode, headers);
    }
};

Context.prototype.responseStatus = function(statusCode, headers) {
    var self = this;
    self.responseStream(null, null, statusCode, headers);
};

Context.prototype.redirect = function(url) {
    var self = this;
    self.responseStatus(302, {
        'Location': url
    });
};

Context.prototype.noChange = function() {
    var self = this;
    self.responseStatus(304);
};

module.exports = Context;
/*end*/