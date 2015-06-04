var fs = require("fs");
var path = require("path");

var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
    self.utils = self.server.require('./core/utils');
    self.tp = self.server.require('./core/tp');
};

//处理请求
Handler.prototype.handleRequest = function(context) {
    var self = this;
    if (context.request.physicalPathExists) {
        var page = self.compilePage(context, context.request.physicalPath);
        if (page == null) return;
        var content = self.execPage(context, page);
        if (content == null) return;
        context.responseContent(content);
    } else {
        context.responseNotFound();
    }
};

Handler.prototype.compilePage = function(context, _path) {
    var self = this;
    try {
        var buffer = fs.readFileSync(_path);
        var page = self.tp.compile(buffer.toString(), {
            extend: self.createExtendObject(context, _path)
        });
        return page;
    } catch (ex) {
        context.responseError(ex.message);
    }
    return null;
};

Handler.prototype.createExtendObject = function(context, pagePath) {
    var self = this;
    var extendObject = {
        "resolvePath": function(_path) {
            var $ = this;
            return path.resolve(path.dirname(pagePath), _path);
        },
        "require": function(_path) {
            var $ = this;
            try {
                return require(_path);
            } catch (ex) {
                try {
                    var resolvePath = $.resolvePath(_path);
                    return require(resolvePath);
                } catch (ex) {
                    context.responseError('在 $.require 时 " ' + _path + ' " 没有找到');
                }
            }
        },
        "include": function(_path) {
            var $ = this;
            var resolvePath = $.resolvePath(_path);
            var page = self.compilePage(context, resolvePath);
            var content = self.execPage(context, page);
            $(content);
        },
        "master": function(_path) {
            var $ = this;
            $._nsp_master = $.resolvePath(_path);
        },
        "placeBegin": function(name) {
            var $ = this;
            $._old_push = $.push;
            $._nsp_palce_content = $._nsp_palce_content || {};
            $._nsp_palce_content[name] = $._nsp_palce_content[name] || [];
            $.push = function(text) {
                $._nsp_palce_content[name].push(text);
            };
        },
        "placeEnd": function() {
            var $ = this;
            if ($._old_push) {
                $.push = $._old_push;
                $._old_push = null;
            }
        },
        "placeHolder": function(name) {
            var $ = this;
            if ($.model && $.model._nsp_palce_content && $.model._nsp_palce_content[name]) {
                $($.model._nsp_palce_content[name].join("") || "");
            }
        }
    };
    self.utils.copy(self.utils, extendObject);
    return extendObject;
};

Handler.prototype.execPage = function(context, page, _nsp_palce_content) {
    var self = this;
    var model = {
        "server": self.server,
        "handler": self,
        "context": context,
        "request": context.request,
        "response": context.response,
        "_nsp_palce_content": _nsp_palce_content
    };
    try {
        var rs = page(model, {
            returnHandler: true
        });
        //如果存在母板页
        if (rs._nsp_master) {
            var masterPage = self.compilePage(context, rs._nsp_master);
            var masterResult = self.execPage(context, masterPage, rs._nsp_palce_content);
            return masterResult;
        } else {
            return rs.result;
        }
    } catch (ex) {
        context.responseError(ex.message);
    }
    return null;
};