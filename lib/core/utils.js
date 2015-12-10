var utils = require("real-utils");
var fs = require('fs');
var path = require('path');
var tp = require('tpjs');

var owner = module.exports = utils;

/**
 * 同步读取 JSON
 **/
owner.readJSONSync = function (jsonFile, useRequire) {
    if (fs.existsSync(jsonFile)) {
        if (useRequire) {
            return require(jsonFile);
        }
        var jsonText = fs.readFileSync(jsonFile);
        if (utils.isNull(jsonText)) {
            return null
        }
        return JSON.parse(jsonText);
    } else {
        return null;
    }
};

/**
 * 同步写入 JSON
 **/
owner.writeJSONSync = function (jsonFile, data) {
    var jsonText = JSON.stringify(data || {});
    fs.writeFileSync(jsonFile, jsonText, null);
};

/**
 * 编译一个模板
 **/
owner.compileTemplateSync = function (templateFile) {
    if (fs.existsSync(templateFile)) {
        var buffer = fs.readFileSync(templateFile);
        return tp.compile(buffer.toString(), {
            extend: owner
        });
    } else {
        return null;
    }
};

/**
 * 拷贝一个目录
 */
owner.copyDir = function (src, dst) {
    var self = this;
    if (fs.existsSync(src)) {
        if (!fs.existsSync(dst)) {
            fs.mkdirSync(dst);
        }
        var files = fs.readdirSync(src);
        files.forEach(function (file, index) {
            var subSrc = src + "/" + file;
            var subDst = dst + "/" + file;
            if (fs.statSync(subSrc).isDirectory()) {
                self.copyDir(subSrc, subDst);
            } else {
                var buffer = fs.readFileSync(subSrc);
                fs.writeFileSync(subDst, buffer);
            }
        });
    }
};

/**
 * 正规化 url
 */
owner.normalizeUrl = function (url) {
    if (!url) return url;
    url = path.normalize(url);
    while (url.indexOf('\\') > -1 || url.indexOf('//') > -1) {
        url = url.replace('\\', '/').replace('//', '/');
    }
    return url;
};