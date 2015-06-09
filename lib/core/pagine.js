var fs = require("fs");
var path = require("path");
var tp = require('./tp');
var utils = require('./utils');

/**
 * 页面引擎
 * Pagine = [pag]e + eng[ine]
 **/
var Pagine = module.exports = function(options) {
    var self = this;
    self.cache = {};
};

//编译一个模板
Pagine.prototype.compile = function(pagePath) {
    var self = this;
    //检查缓存
    if (self.cache[pagePath]) {
        return self.cache[pagePath];
    }
    //编译
    var buffer = fs.readFileSync(pagePath);
    var page = tp.compile(buffer.toString(), {
        extend: self.createExtendObject(pagePath)
    });
    self.cache[pagePath] = page;
    return page;
};

//创建模板扩展对象
Pagine.prototype.createExtendObject = function(pagePath) {
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
                var resolvePath = $.resolvePath(_path);
                return require(resolvePath);
            }
        },
        "include": function(_path) {
            var $ = this;
            var resolvePath = $.resolvePath(_path);
            var content = self.execFile(resolvePath, $.model, $.__options);
            $(content);
        },
        "master": function(_path) {
            var $ = this;
            $.__master = $.resolvePath(_path);
        },
        "placeBegin": function(name) {
            var $ = this;
            $.__old_push = $.push;
            $.__place_content = $.__place_content || {};
            $.__place_content[name] = $.__place_content[name] || [];
            $.push = function(text) {
                $.__place_content[name].push(text);
            };
        },
        "placeEnd": function() {
            var $ = this;
            if ($.__old_push) {
                $.push = $.__old_push;
                $.__old_push = null;
            }
        },
        "placeHolder": function(name) {
            var $ = this;
            if ($.model && $.model.__place_content && $.model.__place_content[name]) {
                $($.model.__place_content[name].join("") || "");
            }
        }
    };
    utils.copy(utils, extendObject);
    return extendObject;
};

//执行一个模板
Pagine.prototype.exec = function(page, model, options) {
    var self = this;
    options = options || {};
    options.returnHandler = true;
    options.extend = options.extend || {};
    options.extend.__options = options;
    var pageHanlder = page(model, options);
    //如果存在母板页
    if (pageHanlder.__master) {
        model.__place_content = pageHanlder.__place_content;
        var result = self.execFile(pageHanlder.__master, model, options);
        return result;
    } else {
        return pageHanlder.result || pageHanlder;
    }
};

//执行一个模板文件
Pagine.prototype.execFile = function(pagePath, model, options) {
    var self = this;
    var page = self.compile(pagePath);
    if (page == null) return;
    var result = self.exec(page, model, options);
    return result;
};

//end