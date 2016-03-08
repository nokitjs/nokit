var http = require("http");
var util = require("util");
var url = require("url");
var utils = require('./utils');
var Stream = require('stream');

function Response(context, origin) {
    var self = this;
    self.context = context;
    self.origin = origin;
    self.__proto__.__proto__ = self.origin;
    self._onEnd = self._onEnd.bind(self)
    self.on('finish', self._onEnd);
};

/**
 * 在响应结束时
 **/
Response.prototype._onEnd = function () {
    var self = this;
    self.context.isEnd = true;
    var req = self.context.request;
    self.context.endTime = Date.now();
    self.context.useTime = self.context.endTime - self.context.beginTime;
    //结束记录日志
    self.context.logger.log([
        req.method,
        req.url,
        req.clientInfo.ip,
        req.headers["referer"] || '.',
        self._headers["content-type"],
        self.statusCode,
        '"' + req.headers["user-agent"] + '"',
        self.context.useTime + 'ms',
        "#" + process.pid
    ].join(' '));
    //释放资源
    self.dispose();
};

/**
 * 释放资源
 **/
Response.prototype.dispose = function () {
    var self = this;
    for (var name in self) {
        if (self[name].disponse) {
            self[name].disponse();
        }
        self[name] = null;
    }
};

/**
 * hook reponse 的 end、setHeader、wirteHead 等方法
 **/
Response.prototype.writeStream = function (stream) {
    var self = this;
    if (self.context.isEnd) return;
    self.context.isEnd = true;
    if (self.context.request.method === 'HEAD') {
        return self.end();
    }
    if (stream === null) {
        return self.end();
    }
    stream.on('end', function () {
        self.end();
    });
    stream.pipe(self);
};

Response.prototype.writeHead = function () {
    var self = this;
    if (self.context.isEnd) return;
    try {
        var args = [].slice.call(arguments || []);
        return self.__proto__.writeHead.apply(self, args);
    } catch (err) {
        self.Response.logger.error(err);
    }
};

Response.prototype.setHeader = function () {
    var self = this;
    if (self.context.isEnd) return;
    try {
        var args = [].slice.call(arguments || []);
        return self.__proto__.__setHeader.apply(self, args);
    } catch (err) {
        return self.Response.logger.error(err);
    }
};

module.exports = Response;