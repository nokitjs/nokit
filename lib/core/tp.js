/**
 * tp 3.6.0
 * tp 模板引擎，最简洁高效的js模板引擎
 * tp 可应用于Node.js，也可以在浏览器环境下使用。
 * 作者：侯锋
 * 邮箱：admin@xhou.net
 * 网站：http://houfeng.net , http://tp.houfeng.net
 */

(function(owner) {
    "use strict";

    //引擎版本
    owner.version = '3.6.0';

    //处理输出转义
    function outTransferred(text) {
        if (!text) return '';
        text = text.replace(new RegExp('\\{1}', 'gim'), '\\\\');
        text = text.replace(new RegExp('\r{1}', 'gim'), '');
        text = text.replace(new RegExp('\n{1}', 'gim'), '\\n');
        text = text.replace(new RegExp('\r{1}', 'gim'), '\\r');
        text = text.replace(new RegExp('\"{1}', 'gim'), '\\"');
        return text;
    }

    //处理输入转义
    function inTransferred(text) {
        if (!text) return '';
        return text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    }

    //检查是否在数组中
    function inArray(array, item) {
        for (var i in array) {
            if (array[i] === item) {
                return true;
            }
        };
        return false;
    };

    //执行一个函数
    function controlledExecute(fn, message) {
        try {
            return fn();
        } catch (ex) {
            ex.message = ex.message || "";
            ex.stack = ex.stack || "";
            ex.message = message + " : " + ex.message + "\r\n    " + ex.stack;
            throw ex;
        }
    }

    //全局扩展容器，全局扩展作用于所有编译或解释的模板
    var gloablExtend = {};

    //扩展函数，如果 det 为空就暂挂到 gloablExtend 上
    function extend(src, dst) {
        if (!src) return;
        dst = dst || gloablExtend;
        for (var name in src) {
            if (!inArray(['func', 'push', 'model', 'buffer'], name)) {
                dst[name] = src[name];
            } else {
                throw 'Can not expand "' + name + ' function"';
            }
        }
    }

    //创建模板上下文句柄，即模块中的 $
    function createHandler(func, model, _extends) {
        var handler = function(text) {
            handler.push(text);
        };
        handler.push = function(text) {
            handler.buffer.push(text);
        };
        for (var i in _extends) {
            if (_extends[i]) extend(_extends[i], handler);
        }
        handler.func = func;
        handler.model = model || {};
        handler.buffer = [];
        return handler;
    }

    //编译一个模板
    //编译模板时可以指定 options.extend 指定编译扩展
    //编译扩展公针当前模板有效，无论第几次执行模板
    function compile(source, options) {
        source = source || '';
        options = options || {};
        var codeBegin = options.codeBegin || owner.codeBegin;
        var codeEnd = options.codeEnd || owner.codeEnd;
        var codeBeginExp = new RegExp(codeBegin, 'gim');
        var codeEndExp = new RegExp(codeEnd, 'gim');
        //提取代码块（包括开始、结束标记）
        var codeExp = new RegExp('(' + codeBegin + '(.|\\\n|\\\r)*?' + codeEnd + ')', 'gim');
        //验证输出表达式
        var outCodeExp = new RegExp(codeBegin + '\\\s*=', 'gim');
        //--
        var codeBuffer = [];
        var codeBlocks = source.match(codeExp) || [];
        var textBlocks = source.replace(codeExp, '▎').split('▎') || [];
        for (var i = 0; i < textBlocks.length; i++) {
            var text = outTransferred(textBlocks[i]);
            var code = codeBlocks[i];
            codeBuffer.push('$.push("' + text + '")');
            if (code !== null && typeof code !== 'undefined') {
                outCodeExp.lastIndex = 0;
                if (outCodeExp.test(code)) {
                    code = '$.push(' + code.replace(outCodeExp, '').replace(codeEndExp, '') + ')';
                } else {
                    code = code.replace(codeBeginExp, '').replace(codeEndExp, '');
                }
                codeBuffer.push(code);
            }
        }
        codeBuffer.push('return $.buffer.join("");');
        //构造模板函数
        //模板执行时，可以指定 execOptions, execOptions.extend 执行扩展仅对本次执行有效
        var func = function(model, execOptions) {
            execOptions = execOptions || {};
            var handler = createHandler(func, model, [gloablExtend, options.extend, execOptions.extend]);
            return controlledExecute(function() {
                //this 当前数据模型，$ 参数为 Handler，$$ 参数为当前数据模型
                handler.result = (handler.func.src.call(handler.model, handler, handler.model) || '');
                return execOptions.returnHandler ? handler : handler.result;
            }, "Template execute error");
        };
        //编译模板函数
        controlledExecute(function() {
            func.src = new Function("$", "$$", codeBuffer.join(';'));
        }, "Template compile error");
        return func;
    }

    owner.codeBegin = '\<\%';
    owner.codeEnd = '\%\>';

    /**
     * 扩展引擎功能
     */
    owner.extend = extend;

    /**
     * 编译一个模板,source:模板源字符串,options编译选项
     * 编译模板时可以指定 options.extend 指定编译扩展
     * 编译扩展公针当前模板有效，无论第几次执行模板
     */
    owner.compile = function(source, options) {
        return compile(source, options);
    };

    /**
     * 解析模板,source:模板源字符串,model:数据模型
     * options 为编译选项，编译模板时可以指定 options.extend 指定编译扩展
     * 模板执行时，可以指定execOptions, execOptions.extend 执行扩展仅对本次执行有效
     */
    owner.parse = function(source, model, options, execOptions) {
        var fn = compile(source, options);
        return fn(model, execOptions);
    };

    /**
     * 如果在浏览器环境，添加针对DOM的扩展方法；
     */
    if (typeof window !== 'undefined' && window.document) {
        owner.query = function(id) {
            return window.document.getElementById(id);
        };
        owner.bind = function(options) {
            options = options || {};
            var query = options.query || owner.query;
            options.el = options.el || options.element;
            options.el = (typeof options.el === 'string') ? query(options.el) : options.el;
            options.tp = options.tp || options.template || options.el;
            options.tp = (typeof options.tp === 'string') ? (query(options.tp) || options.tp) : options.tp;
            if (!options.tp || !options.el) return;
            var tempFunc = compile(inTransferred(options.tp.innerHTML || options.tp), options);
            if (options.append) {
                options.el.innerHTML += tempFunc(options.model);
            } else {
                options.el.innerHTML = tempFunc(options.model);
            }
        };
    }

})((function() {
    var owner = {};
    //支持CommonJS规范
    if (typeof exports !== 'undefined') {
        owner = exports;
        owner.env = owner.env || [];
        owner.env.push("commaonjs");
    }
    //支持AMD规范
    if (typeof define === 'function' && define.amd) {
        owner.env = owner.env || [];
        owner.env.push("amd");
        define('tp', [], function() {
            return owner;
        });
    }
    //常规方式，挂在 this 对象上
    if (owner.env == null || owner.env.length < 1) {
        owner.env = owner.env || [];
        owner.env.push("general");
        this.tp = owner;
    }
    return owner;
})());
//end.