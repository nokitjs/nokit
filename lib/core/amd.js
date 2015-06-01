//创建兼容 amd 规范定义的 define
exports.createDefine = function(srcModule) {
    return function(id, deps, declare) {
        var fn = declare;
        if (typeof deps === 'function') fn = deps;
        if (typeof id === 'id') fn = id;
        fn(srcModule.require, srcModule.exports, srcModule);
    };
};

/*
在 AMD 模块文件最上边加入如下代码，AMD 模块即可在 nodejs 中加载
if (typeof define !== 'function' && typeof require === 'function') {
    var define = require('./amd').createDefine(module);
}
*/

