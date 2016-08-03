const http = require("http");
const util = require("util");
const url = require("url");
const utils = require('./utils');
const Stream = require('stream');

function Response(context) {
  var self = this;
  self.context = context;
};

util.inherits(Response, http.ServerResponse);

/**
 * 释放资源
 **/
Response.prototype.dispose = utils.defineDisposer([
  "context"
]);

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
    req.getHeader("referrer", '.'),
    self.mime || self._headers["content-type"],
    self.statusCode,
    '"' + req.getHeader("user-agent") + '"',
    self.context.useTime + 'ms',
    "#" + process.pid
  ].join(' '), { callback: function () { self.dispose(); } });
};

/**
 * 写数据流
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

/**
 * 写头信息
 **/
Response.prototype.writeHead = function () {
  var self = this;
  if (self.context.isEnd) return;
  try {
    var args = [].slice.call(arguments || []);
    return self.__writeHead.apply(self, args);
  } catch (err) {
    self.context.logger.error(err);
  }
};

/**
 * 写头信息
 **/
Response.prototype.setHeader = function () {
  var self = this;
  if (self.context.isEnd) return;
  try {
    var args = [].slice.call(arguments || []);
    return self.__setHeader.apply(self, args);
  } catch (err) {
    return self.context.logger.error(err);
  }
};

Response.init = function (context) {
  context.response.__setHeader = context.response.setHeader;
  context.response.__writeHead = context.response.writeHead;
  context.response.__proto__ = new Response(context);
  context.response._onEnd = context.response._onEnd.bind(context.response);
  context.response.removeListener('finish', context.response._onEnd);
  context.response.on('finish', context.response._onEnd);
};

module.exports = Response;