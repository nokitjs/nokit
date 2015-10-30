var path = require("path");
var fs = require("fs");
var qs = require("querystring");
var url = require("url");
var zlib = require("zlib");
var Stream = require('stream');
var Cookie = require("./cookie");
var utils = require('./utils');
var tp = require('tpjs');

/**
 * http 请求上下文对象
 */
var Context = function (server, req, res) {
    var self = this;
    self._init(server, req, res);
    self._handleLogger();
    self._hookResponse();
    self._handleRequestPath();
    self._handleQueryString();
    self._handleCookie();
    self._handleClientInfo();
    self._logBegin();
};

Context.prototype._init = function (server, req, res) {
    var self = this;
    self.beginTime = Date.now();
    self.ignoreHandlers = [];
    self.ignoreUrls = [];
    self.server = server;
    self.request = req;
    self.response = res;
    self.configs = server.configs;
    self.configs.cache = self.configs.cache || {};
    self.configs.compress = self.configs.compress || [];
};

Context.prototype._handleLogger = function () {
    var self = this;
    self.logger = new self.server.Logger();
};

Context.prototype._logBegin = function () {
    var self = this;
    var req = self.request;
    //开始记录日志
    self.logger.log([
        req.method,
        req.url,
        req.clientInfo.ip,
        req.headers["referer"],
        req.headers["user-agent"]
    ].join('|'));
};

Context.prototype._logEnd = function () {
    var self = this;
    if (self._logIsEnd) return;
    var res = self.response;
    self.endTime = Date.now();
    self.useTime = self.endTime - self.beginTime;
    //结束记录日志
    self.logger.log([
        res.statusCode,
        res._headers["content-type"],
        self.useTime + 'ms'
    ].join('|'));
    self.logger.writeBuffer();
    self._logIsEnd = true;
};

Context.prototype._hookResponse = function () {
    var self = this;
    self.onEnd = function (callback) {
        self.isEnd = true;
        self.filterInvoker.invoke('onRequestEnd', self, function () {
            if (callback) callback();
        });
    };
    self.response.__end = self.response.end;
    self.response.end = function () {
        var res = this;
        var args = arguments;
        self.onEnd(function () {
            res.__end.apply(res, args);
            self._logEnd();
        });
    };
    self.response.writeStream = function (stream) {
        var res = this;
        self.onEnd(function () {
            stream.pipe(res);
            stream.on('end', function () {
                res.__end();
                self._logEnd();
            });
        });
    };
    self.response.__writeHead = self.response.writeHead;
    self.response.writeHead = function () {
        if (self.isEnd) return;
        var res = this;
        var args = arguments;
        res.__writeHead.apply(res, args);
    };
    self.response.__setHeader = self.response.setHeader;
    self.response.setHeader = function () {
        if (self.isEnd) return;
        var res = this;
        var args = arguments;
        res.__setHeader.apply(res, args);
    };
};

Context.prototype._handleRequestPath = function () {
    var self = this;
    var req = self.request;
    req.publicPath = path.resolve(self.configs.root, self.configs.folders.public);
    req.setUrl = function (url, doNotUpdatePhysicalPath) {
        url = (url || "/").replace(/\.\./g, "");
        req.url = decodeURI(utils.normalizeUrl(url));
        var urlParts = req.url.split('?');
        req.withoutQueryStringURL = req.withoutQueryStringUrl = urlParts[0].split('#')[0];
        req.queryString = (urlParts[1] || '').split('#')[0];
        if (!doNotUpdatePhysicalPath) {
            req.setPhysicalPath(req.publicPath + '/' + req.withoutQueryStringURL);
        }
    };
    req.setPhysicalPath = function (_path) {
        req.physicalPath = path.normalize(_path);
        req.extname = path.extname(req.physicalPath);
        req.mime = self.server.mime(req.extname) || self.server.mime("*");
        req._physicalPathExists = null;
        req._physicalPathStats = null;
    };
    req.setUrl(req.url);
    req.physicalPathExists = function (callback) {
        if (!callback) return;
        if (!utils.isNull(req._physicalPathExists)) {
            return callback(req._physicalPathExists);
        }
        if (!utils.isString(req.physicalPath)) {
            req._physicalPathExists = false;
            return callback(req._physicalPathExists);
        }
        fs.exists(req.physicalPath, function (exists) {
            req._physicalPathExists = exists;
            return callback(req._physicalPathExists);
        });
    };
    req.physicalPathStat = function (callback) {
        if (!callback) return;
        if (!utils.isNull(req._physicalPathStats)) {
            return callback(req._physicalPathStats, req._physicalPathExists);
        }
        req.physicalPathExists(function (exists) {
            if (!exists) {
                req._physicalPathStats = {};
                return callback(req._physicalPathStats, req._physicalPathExists);
            }
            fs.stat(req.physicalPath, function (err, stats) {
                if (err) {
                    return self.error(err);
                }
                req._physicalPathStats = stats;
                return callback(req._physicalPathStats, req._physicalPathExists);
            });
        });
    };
};

Context.prototype._handleCookie = function () {
    var self = this;
    var req = self.request,
        res = self.response;
    req.cookie = new Cookie(self, {
        type: Cookie.TYPE_REQUEST
    });
    res.cookie = new Cookie(self, {
        type: Cookie.TYPE_RESPONSE
    });
};

Context.prototype._handleQueryString = function () {
    var self = this;
    var req = self.request;
    req.queryData = qs.parse(req.queryString) || {};
};

Context.prototype._handleClientInfo = function () {
    var self = this;
    var req = self.request;
    req.clientInfo = req.clientInfo || {};
    req.clientInfo.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    var hostParts = (req.headers['host'] || '').split(':');
    req.clientInfo.host = hostParts[0];
    req.clientInfo.port = hostParts[1];
    req.clientInfo.userAgent = req.headers['user-agent'];
};

Context.prototype._checkCache = function (type) {
    var self = this;
    if (utils.isNull(self.configs.cache.match)) {
        return false;
    }
    var url = self.request.withoutQueryStringURL;
    return utils.each(self.configs.cache.match, function (i, rule) {
        var exp = new RegExp(rule);
        if (exp.test(url)) {
            return true;
        }
    });
};

Context.prototype._checkCompress = function () {
    var self = this;
    if (!utils.isNull(self.canCompress)) {
        return self.canCompress;
    }
    var url = self.request.withoutQueryStringURL;
    return utils.each(self.configs.compress, function (i, rule) {
        var exp = new RegExp(rule);
        if (exp.test(url)) {
            return true;
        }
    });
};

Context.prototype.contentType = function (mime) {
    var self = this;
    if (mime) {
        self.response.getHeader('Content-Type', mime);
    } else {
        return self.response.getHeader('Content-Type') || self.request.mime;
    }
};

Context.prototype.stream = function (contentStream, mime, statusCode, headers) {
    var self = this;
    self.response.mime = mime || self.response.getHeader('Content-Type') || self.request.mime;
    self.response.contentStream = contentStream;
    self.response.statusCode = statusCode || self.response.statusCode || 200;
    self.filterInvoker.invoke('onResponse', self, function () {
        //处理客户端缓存开始
        var maxAge = self.configs.cache.maxAge;
        if (maxAge && maxAge > 0 && self._checkCache()) {
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
        if (self.response.contentStream != null && self._checkCompress()) {
            var acceptEncoding = self.request.headers['accept-encoding'] || "";
            var gzip = (acceptEncoding.match(/\bgzip\b/) || [])[0];
            var deflate = (acceptEncoding.match(/\bdeflate\b/) || [])[0];
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
            self.response.writeStream(responseStream);
        } else {
            self.response.end();
        }
    });
};

Context.prototype.content = function (content, mime, statusCode, headers) {
    var self = this;
    var isStream = (content instanceof Stream);
    if (isStream || utils.isNull(content)) {
        self.stream(content, mime, statusCode, headers);
    } else {
        //转换为流
        var contentStream = new Stream.Readable();
        contentStream.push(content);
        contentStream.push(null);
        self.stream(contentStream, mime, statusCode, headers);
    }
};

Context.prototype.data = function (name) {
    var self = this;
    self.routeData = self.routeData || {};
    self.request.queryData = self.request.queryData || {};
    self.request.formData = self.request.formData || {};
    return self.request.queryData[name] || self.request.formData[name] || self.routeData[name];
};

Context.prototype.template = function (template, model, mime, statusCode, headers) {
    var self = this;
    var templateFunc = utils.isFunction(template) ? template :
        self.server.templatePage(template);
    var contentBuffer = templateFunc ? templateFunc(model) : null;
    self.canCompress = self.configs.template.compress;
    self.content(contentBuffer, mime, statusCode, headers);
};

Context.prototype.statusWithContent = function (statusCode, options, headers) {
    var self = this;
    options = options || {};
    if (utils.isString(options)) {
        options = {
            "template": options
        };
    }
    var mime = self.server.mime('.html');
    var template = options.template ?
        (utils.isFunction(options.template) ? options.template : tp.compile(options.template)) :
        statusCode;
    var model = options.model || {};
    model.context = self;
    model.server = self.server;
    model.request = self.request;
    model.response = self.response;
    self.template(template, model, mime, statusCode, headers);
};

Context.prototype.status = function (statusCode, headers) {
    var self = this;
    self.stream(null, null, statusCode, headers);
};

Context.prototype.error = function (err, template) {
    var self = this;
    err = err || '未知的服务器错误';
    var errorMessage = err.message || err;
    if (self.configs.debugMode) {
        errorMessage = (err.message && err.stack) ? (err.message + "\r\n" + err.stack) : err;
    }
    self.logger.error(errorMessage);
    self.errorMessage = errorMessage;
    self.filterInvoker.invoke('onError', self, function () {
        self.statusWithContent(500, {
            "template": template,
            "model": {
                "errorMessage": self.errorMessage
            }
        });
    });
};

Context.prototype.notFound = function (template, model) {
    var self = this;
    self.statusWithContent(404, {
        "template": template,
        "model": model
    });
};

Context.prototype.deny = function (template, model) {
    var self = this;
    self.statusWithContent(403, {
        "template": template,
        "model": model
    });
};

Context.prototype.notAllowed = function (template, model) {
    var self = this;
    self.statusWithContent(405, {
        "template": template,
        "model": model
    });
};

Context.prototype.redirect = function (_toUrl) {
    var self = this;
    //处理相对路径
    var toUrl = url.resolve(self.request.url, _toUrl);
    self.status(302, {
        'Location': toUrl
    });
};

Context.prototype.transfer = function (_toUrl) {
    var self = this;
    //处理相对路径
    var toUrl = url.resolve(self.request.url, _toUrl);
    //检查循环
    if (utils.contains(self.ignoreUrls, toUrl)) {
        return self.error('在转移到 "' + toUrl + '" 时,发现了循环');
    }
    self.ignoreUrls.push(toUrl);
    self.request.setUrl(toUrl);
    self.ignoreHandlers = [];
    //下划线开头的方法，为私有方法，不要随意调用
    //这里只能这个方法达到 ignoreHandlers 为空的目的
    //以使新的 url 能有机会被相应的 handler 接收到
    self.server._matchHandlerAndHandleRequest(self);
};

Context.prototype.noChange = function () {
    var self = this;
    self.status(304);
};

module.exports = Context;
/*end*/