var path = require("path");
var fs = require("fs");
var qs = require("querystring");
var url = require("url");
var zlib = require("zlib");
var Stream = require('stream');
var Cookie = require("./cookie");
var utils = require('./utils');
var Session = require("./session");

var SID_COOKIE_NAME = 'NSID';

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
    self._handleSession();
    self._handleClientInfo();
    self._handleLocale();
};

/**
 * 初始化
 **/
Context.prototype._init = function (server, req, res) {
    var self = this;
    self.beginTime = Date.now();
    self.ignoreHandlers = [];
    self.ignoreUrls = [];
    self.server = server;
    self.request = self.req = req;
    self.response = self.res = res;
    self.configs = server.configs;
    self.configs.cache = self.configs.cache || {};
    self.configs.compress = self.configs.compress || [];
    self.shouldCompress = false;
    self.shouldCache = false;
    self._bindFunc();
};

/**
 * 绑定 context 的一些函数
 **/
Context.prototype._bindFunc = function () {
    var self = this;
    self._onEnd = self._onEnd.bind(self);
};

/**
 * 初始化日志组件
 **/
Context.prototype._handleLogger = function () {
    var self = this;
    self.logger = self.server.logger;
};

/**
 * 日志结束
 **/
Context.prototype._onEnd = function () {
    var self = this;
    self.isEnd = true;
    var req = self.request;
    var res = self.response;
    self.endTime = Date.now();
    self.useTime = self.endTime - self.beginTime;
    //结束记录日志
    self.logger.log([
        req.method,
        req.url,
        req.clientInfo.ip,
        req.headers["referer"] || '.',
        res._headers["content-type"],
        res.statusCode,
        '"' + req.headers["user-agent"] + '"',
        self.useTime + 'ms',
        "#" + process.pid
    ].join(' '));
    //释放资源
    self.dispose();
};

/**
 * 释放 context 上的所有资源
 **/
Context.prototype.dispose = function () {
    var self = this;
    for (var key in [
        "request",
        "response",
        "controller",
        "session",
        "action",
        "locale"
    ]) {
        self[key] = null;
        delete self[key];
    }
    self = null;
};

/**
 * hook reponse 的 end、setHeader、wirteHead 等方法
 **/
Context.prototype._hookResponse = function () {
    var self = this;
    var res = self.response;
    var req = self.request;
    res.on('finish', self._onEnd);
    res.writeStream = function (stream) {
        if (self.isEnd) return;
        self.isEnd = true;
        if (req.method === 'HEAD') {
            return res.end();
        }
        if (stream === null) {
            return res.end();
        }
        stream.on('end', function () {
            res.end();
        });
        stream.pipe(res);
    };
    res.__writeHead = res.writeHead;
    res.writeHead = function () {
        if (self.isEnd) return;
        try {
            var args = [].slice.call(arguments || []);
            return res.__writeHead.apply(res, args);
        } catch (err) {
            self.logger.error(err);
        }
    };
    res.__setHeader = res.setHeader;
    res.setHeader = function () {
        if (self.isEnd) return;
        try {
            var args = [].slice.call(arguments || []);
            return res.__setHeader.apply(res, args);
        } catch (err) {
            return self.logger.error(err);
        }
    };
};

/**
 * 匹配合适的静态目录
 **/
Context.prototype._matchPublicPath = function (withoutQueryStringUrl) {
    var self = this;
    var _publicPath = utils.each(self.configs.folders.public, function (exprText, _path) {
        if (exprText === "*") return;
        var expr = RegExp(exprText);
        if (expr.test(withoutQueryStringUrl)) {
            return _path;
        }
    });
    if (!_publicPath) {
        _publicPath = self.configs.folders.public["*"];
    }
    return self.server.resolvePath(_publicPath);
};

/**
 * 处理请求的 URL、路径等
 **/
Context.prototype._handleRequestPath = function () {
    var self = this;
    var req = self.request;
    req.setUrl = function (url, doNotUpdatePhysicalPath) {
        url = (url || "/").replace(/\.\./g, "");
        //可能会出现 “URIError: URI malformed”
        try {
            req.url = decodeURI(utils.normalizeUrl(url));
        } catch (ex) {
            req.url = url;
            self.logger.error(ex);
        }
        var urlParts = req.url.split('?');
        req.withoutQueryStringURL = req.withoutQueryStringUrl = urlParts[0].split('#')[0];
        req.queryString = (urlParts[1] || '').split('#')[0];
        req.publicPath = self._matchPublicPath(req.withoutQueryStringUrl);
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

/**
 * 处理 cookie
 **/
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

/**
 * 处理 Session
 **/
Context.prototype._handleSession = function () {
    var self = this;
    var sessionConfigs = self.configs.session;
    if (!sessionConfigs.enabled) {
        return;
    }
    var req = self.request,
        res = self.response;
    self.sessionId = req.cookie.get(SID_COOKIE_NAME);
    if (!self.sessionId) {
        self.sessionId = utils.newGuid().split('-').join('');
        res.cookie.set(SID_COOKIE_NAME, self.sessionId, {
            "httpOnly": true,
            "secure": sessionConfigs.isHttps
        });
    }
    //创建 session 对象
    self.session = new Session(self.sessionId, self.server.sessionStore);
    //通知活动状态
    self.session.active();
};

/**
 * 处理查询字符串
 **/
Context.prototype._handleQueryString = function () {
    var self = this;
    var req = self.request;
    req.query = req.queryData = qs.parse(req.queryString) || {};
};

/**
 * 处理客户端信息
 **/
Context.prototype._handleClientInfo = function () {
    var self = this;
    var req = self.request;
    req.clientInfo = req.clientInfo || {};
    req.clientInfo.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    var hostParts = (req.headers['host'] || '').split(':');
    req.clientInfo.host = hostParts[0];
    req.clientInfo.port = hostParts[1];
    req.clientInfo.userAgent = req.headers['user-agent'];
    //解析出客户端所有接受的语言
    req.clientInfo.languages = (req.headers["accept-language"] || '')
        .split(',')
        .map(function (name) {
            return name.split(';')[0]
        });
};

/**
 * 处理本地化语言
 **/
Context.prototype._handleLocale = function () {
    var self = this;
    self.locale = self.server.localeMgr.getByContext(self) || {};
};

/**
 * 设定 locale
 **/
Context.prototype.setLocale = function (localeName) {
    var self = this;
    self.locale = self.server.localeMgr.get(localeName) || {};
};

/**
 * 检查资源是否可缓存
 **/
Context.prototype._checkCache = function (type) {
    var self = this;
    if (!self.configs.cache.enabled || !self.shouldCache) {
        return false;
    }
    var url = self.request.withoutQueryStringURL;
    return utils.each(self.configs.cache.match, function (i, rule) {
        var exp = new RegExp(rule);
        if (exp.test(url)) {
            return true;
        }
    }) || utils.each(self.configs.cache.type, function (name, mimeType) {
        if (mimeType == self.response.mime) {
            return true
        }
    });
};

/**
 * 检查资源是否可压缩
 **/
Context.prototype._checkCompress = function () {
    var self = this;
    if (!self.configs.compress.enabled || !self.shouldCompress) {
        return false;
    }
    var url = self.request.withoutQueryStringURL;
    return utils.each(self.configs.compress.match, function (i, rule) {
        var exp = new RegExp(rule);
        if (exp.test(url)) {
            return true;
        }
    }) || utils.each(self.configs.compress.type, function (name, mimeType) {
        if (mimeType == self.response.mime) {
            return true
        }
    });
};

/**
 * 设定 ContentType
 **/
Context.prototype.contentType = function (mime) {
    var self = this;
    if (mime) {
        self.response.getHeader('Content-Type', mime);
    } else {
        return self.response.getHeader('Content-Type') || self.request.mime;
    }
};
 
/**
 * 向浏览器输出流
 **/
Context.prototype.stream = function (contentStream, mime, statusCode, headers) {
    var self = this;
    if (self.isEnd) return;
    self.response.mime = mime || self.response.getHeader('Content-Type') || self.request.mime;
    self.response.contentStream = contentStream;
    self.response.statusCode = statusCode || self.response.statusCode || 200;
    self.filterInvoker.invoke('onResponse', self, function (err) {
        if (err) {
            return self.error(err);
        }
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
        if (self.response.contentStream !== null &&
            self.response.contentStream !== undefined &&
            self._checkCompress()) {
            var acceptEncoding = self.request.headers['accept-encoding'] || "";
            var gzip = (acceptEncoding.match(/\bgzip\b/) || [])[0];
            var deflate = (acceptEncoding.match(/\bdeflate\b/) || [])[0];
            if (gzip) {
                headers['Content-Encoding'] = gzip;
                responseStream = self.response.contentStream.pipe(zlib.createGzip());
            } else if (deflate) {
                headers['Content-Encoding'] = deflate;
                responseStream = self.response.contentStream.pipe(zlib.createDeflate());
            }
        }
        //处理压缩结束
        self.response.writeHead(self.response.statusCode, headers);
        if (responseStream !== null &&
            responseStream !== undefined) {
            self.response.writeStream(responseStream);
        } else {
            self.response.end();
        }
    });
};

/**
 * 向浏览器输出文本
 **/
Context.prototype.text = function (text, mime, statusCode, headers) {
    var self = this;
    if (text === null) {
        return self.stream(text, mime, statusCode, headers);
    }
    //强制转换为 string
    text = String(text);
    //转换为流
    var contentStream = new Stream.Readable();
    contentStream.push(text);
    contentStream.push(null);
    self.stream(contentStream, mime, statusCode, headers);
};

/**
 * 向浏览器输出一个文件
 **/
Context.prototype.file = function (filePath, mime, statusCode, headers) {
    var self = this;
    var fileReadStream = fs.createReadStream(filePath);
    self.stream(fileReadStream, null, null, headers);
};

/**
 * 向浏览器输出文本或流
 **/
Context.prototype.send = Context.prototype.write = function (content, mime, statusCode, headers) {
    var self = this;
    var isStream = content instanceof Stream.Readable;
    if (isStream || utils.isNull(content)) {
        self.stream(content, mime, statusCode, headers);
    } else if (utils.isString(content) ||
        utils.isNumber(content)) {
        self.text(content, mime, statusCode, headers);
    } else {
        self.json(content, mime, statusCode, headers);
    }
};

/**
 * 向浏览器发送的 json 字符串
 **/
Context.prototype.json = function (jsonObject) {
    var self = this;
    var jsonText = null;
    try {
        jsonText = JSON.stringify(jsonObject);
    } catch (err) {
        return self.error(err);
    }
    self.text(jsonText, self.server.mime('.json'));
};

/**
 * 向浏览器发送 jsonp
 **/
Context.prototype.jsonp = function (jsonObject) {
    var self = this;
    var jsonText = null;
    try {
        jsonText = JSON.stringify(jsonObject);
    } catch (err) {
        return self.error(err);
    }
    var jsonpCallback = self.params(self.configs.jsonpParam);
    if (jsonpCallback) {
        self.text("/**/" + jsonpCallback + "(" + jsonText + ")", self.server.mime('.js'));
    } else {
        self.error('jsonp 需要 "' + self.configs.jsonpParam + '" GET 参数');
    }
};

/**
 * 获取参数 query>form>route
 **/
Context.prototype.params = function (name) {
    var self = this;
    self.routeData = self.routeData || {};
    self.request.files = self.request.files || {};
    self.request.queryData = self.request.queryData || {};
    self.request.formData = self.request.formData || {};
    return self.request.queryData[name] || self.request.formData[name] || self.routeData[name] || self.request.files[name];
};

/**
 * 获取查询参数 querystring
 **/
Context.prototype.query = Context.prototype.queryData = function (name) {
    var self = this;
    return self.request.queryData[name];
};

/**
 * 获取 form 数据 querystring
 **/
Context.prototype.form = Context.prototype.formData = function (name) {
    var self = this;
    return self.request.formData[name];
};

/**
 * 获取 route 参数
 **/
Context.prototype.routeData = function (name) {
    var self = this;
    self.routeData = self.routeData || {};
    return self.routeData[name];
};

/**
 * 向浏览器输出一个模板
 **/
Context.prototype.template = function (template, model, mime, statusCode, headers) {
    var self = this;
    var templateFunc = utils.isFunction(template) ? template :
        self.server.templatePage(template);
    var contentBuffer = templateFunc ? templateFunc(model) : null;
    self.shouldCompress = self.configs.template.compress;
    self.text(contentBuffer, mime, statusCode, headers);
};

/**
 * 向浏览器响应一个状态（并根据模板输入内容）
 **/
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
        (utils.isFunction(options.template) ? options.template : self.viewEngine.compileText(options.template)) :
        statusCode;
    var model = options.model || {};
    model.context = self;
    model.server = self.server;
    model.request = self.request;
    model.response = self.response;
    self.template(template, model, mime, statusCode, headers);
};

/**
 * 向浏览器响应一个状态
 **/
Context.prototype.status = function (statusCode, headers) {
    var self = this;
    self.stream(null, null, statusCode, headers);
};

/**
 * 向浏览器输出一个错误
 **/
Context.prototype.error = function (err, template) {
    var self = this;
    err = err || new Error('未知的服务器错误');
    if (!(err instanceof Error)) {
        err = new Error(err);
    }
    self.logger.error(err);
    self.lastError = err;
    self.filterInvoker.invoke('onError', self, function (err) {
        self.statusWithContent(500, {
            "template": template,
            "model": {
                "lastError": (self.lastError || err || {}),
                "showErrorDetail": self.configs.showErrorDetail
            }
        });
    });
};

/**
 * 响应 404
 **/
Context.prototype.notFound = function (template, model) {
    var self = this;
    self.statusWithContent(404, {
        "template": template,
        "model": model
    });
};

/**
 * 响应 403
 **/
Context.prototype.forbidden = function (template, model) {
    var self = this;
    self.statusWithContent(403, {
        "template": template,
        "model": model
    });
};

/**
 * 响应 405
 **/
Context.prototype.notAllowed = function (template, model) {
    var self = this;
    self.statusWithContent(405, {
        "template": template,
        "model": model
    });
};

/**
 * 302 重定向
 **/
Context.prototype.redirect = function (_toUrl) {
    var self = this;
    //处理相对路径
    var toUrl = url.resolve(self.request.url, _toUrl);
    self.status(302, {
        'Location': toUrl
    });
};

/**
 * 301 重定向
 **/
Context.prototype.permanentRedirect = function (_toUrl) {
    var self = this;
    //处理相对路径
    var toUrl = url.resolve(self.request.url, _toUrl);
    self.status(301, {
        'Location': toUrl
    });
};

/**
 * URL 重写
 **/
Context.prototype.transfer = function (_toUrl) {
    var self = this;
    //处理相对路径
    var toUrl = url.resolve(self.request.url, _toUrl);
    //检查循环
    if (utils.contains(self.ignoreUrls, toUrl)) {
        return self.error('在重写到 "' + toUrl + '" 时,发现了循环');
    }
    self.ignoreUrls.push(toUrl);
    self.request.setUrl(toUrl);
    self.ignoreHandlers = [];
    //下划线开头的方法，为私有方法，不要随意调用
    //这里只能这个方法达到 ignoreHandlers 为空的目的
    //以使新的 url 能有机会被相应的 handler 接收到
    self.server._matchHandlerAndHandleRequest(self);
};

/**
 * 响应 304
 **/
Context.prototype.noChange = function () {
    var self = this;
    self.status(304);
};

module.exports = Context;
/*end*/