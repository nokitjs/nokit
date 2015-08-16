var path = require("path");
var fs = require("fs");
var qs = require("querystring");
var url = require("url");
var zlib = require("zlib");
var Stream = require('stream');
var Cookie = require("./cookie");
var utils = require('./utils');
var tp = require('tpjs');

var SESSION_ID_NAME = 'NSESSIONID';
var MODE_DEBUG = 'debug';

/**
 * http 请求上下文对象
 */
var Context = function(server, req, res) {
    var self = this;
    self._init(server, req, res);
    self._hookResponse();
    self._handleRequestPath();
    self._handleQueryString();
    self._handleCookie();
    self._handleSession();
    self._handleClientInfo();
};

Context.prototype._init = function(server, req, res) {
    var self = this;
    self.ignoreHandlers = [];
    self.beginTime = Date.now();
    self.server = server;
    self.request = req;
    self.response = res;
    self.configs = server.configs;
    self.configs.cache = self.configs.cache || {};
    self.configs.cache.client = self.configs.cache.client || {};
    self.configs.compress = self.configs.compress || [];
};

Context.prototype._hookResponse = function() {
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
    self.response.writeStream = function(stream) {
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

Context.prototype._handleRequestPath = function() {
    var self = this;
    var req = self.request,
        res = self.response;
    req.setUrl = function(url) {
        req.url = path.normalize(decodeURI(url || ""));
        var urlParts = req.url.split('?');
        req.withoutQueryStringURL = urlParts[0].split('#')[0].replace(/\.\./g, "");
        req.queryString = (urlParts[1] || '').split('#')[0];
    };
    req.setUrl(req.url);
    req.publicPath = path.resolve(self.configs.root, self.configs.folders.public);
    req.setPhysicalPath = function(_path) {
        req.physicalPath = path.normalize(_path);
        req.extname = path.extname(req.physicalPath);
        req.mime = self.server.mime(req.extname) || self.server.mime("*");
        req.physicalPathExists = fs.existsSync(req.physicalPath);
        if (req.physicalPathExists) {
            req.physicalPathStats = fs.statSync(req.physicalPath);
            req.physicalPathType = req.physicalPathStats.isDirectory() ? 'folder' : 'file'
        }
    };
    req.setPhysicalPath(req.publicPath + '/' + req.withoutQueryStringURL);
};

Context.prototype._handleCookie = function() {
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

Context.prototype._handleSession = function() {
    var self = this;
    if (!self.configs.session.state) return;
    var req = self.request,
        res = self.response;
    req.sessionId = req.cookie.get(SESSION_ID_NAME);
    if (!req.sessionId) {
        req.sessionId = utils.newGuid().split('-').join('');
        res.cookie.add(SESSION_ID_NAME, req.sessionId);
    }
    //--
    self.session = new self.server.SessionProvier({
        sessionId: req.sessionId,
        server: self
    });
};

Context.prototype._handleQueryString = function() {
    var self = this;
    var req = self.request;
    req.queryData = qs.parse(req.queryString) || {};
};

Context.prototype._handleClientInfo = function() {
    var self = this;
    var req = self.request;
    req.clientInfo = req.clientInfo || {};
    req.clientInfo.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    var hostParts = (req.headers['host'] || '').split(':');
    req.clientInfo.host = hostParts[0];
    req.clientInfo.port = hostParts[1];
    req.clientInfo.userAgent = req.headers['user-agent'];
};

Context.prototype._checkCache = function(type) {
    var self = this;
    var url = self.request.withoutQueryStringURL;
    return utils.each(self.configs.cache.client.match, function(i, rule) {
        var exp = new RegExp(rule);
        if (exp.test(url)) {
            return true;
        }
    });
};

Context.prototype._checkCompress = function() {
    var self = this;
    if (!utils.isNull(self.canCompress)) {
        return self.canCompress;
    }
    var url = self.request.withoutQueryStringURL;
    return utils.each(self.configs.compress, function(i, rule) {
        var exp = new RegExp(rule);
        if (exp.test(url)) {
            return true;
        }
    });
};

Context.prototype.stream = function(contentStream, mime, statusCode, headers) {
    var self = this;
    self.response.mime = mime || self.response.getHeader('Content-Type') || self.request.mime;
    self.response.contentStream = contentStream;
    self.response.statusCode = statusCode || self.response.statusCode || 200;
    self.filters.invoke('onResponse', self, function() {
        //处理客户端缓存开始
        var maxAge = self.configs.cache.client.maxAge;
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
            self.response.writeStream(responseStream);
        } else {
            self.response.end();
        }
    });
};

Context.prototype.content = function(content, mime, statusCode, headers) {
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

Context.prototype.data = function(name) {
    var self = this;
    self.routeData = self.routeData || {};
    return self.request.queryData[name] || self.request.formData[name] || self.routeData[name];
};

Context.prototype.template = function(template, model, mime, statusCode, headers) {
    var self = this;
    var templateFunc = utils.isFunction(template) ? template :
        self.server.templatePage(template);
    var contentBuffer = templateFunc ? templateFunc(model) : null;
    self.canCompress = self.configs.template.compress;
    self.content(contentBuffer, mime, statusCode, headers);
};

Context.prototype.statusWithContent = function(statusCode, options, headers) {
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

Context.prototype.status = function(statusCode, headers) {
    var self = this;
    self.stream(null, null, statusCode, headers);
};

Context.prototype.error = function(err, template) {
    var self = this;
    var errorMessage = err.message || err;
    if (self.configs.mode == MODE_DEBUG) {
        errorMessage = (err.message && err.stack) ? (err.message + "\r\n" + err.stack) : err;
    }
    self.server.logger.error(errorMessage);
    self.errorMessage = errorMessage;
    self.filters.invoke('onError', self, function() {
        self.statusWithContent(500, {
            "template": template,
            "model": {
                "errorMessage": self.errorMessage
            }
        });
    });
};

Context.prototype.notFound = function(template, model) {
    var self = this;
    self.statusWithContent(404, {
        "template": template,
        "model": model
    });
};

Context.prototype.deny = function(template, model) {
    var self = this;
    self.statusWithContent(403, {
        "template": template,
        "model": model
    });
};

Context.prototype.notAllowed = function(template, model) {
    var self = this;
    self.statusWithContent(405, {
        "template": template,
        "model": model
    });
};

Context.prototype.redirect = function(url) {
    var self = this;
    self.status(302, {
        'Location': url
    });
};

Context.prototype.noChange = function() {
    var self = this;
    self.status(304);
};

module.exports = Context;
/*end*/