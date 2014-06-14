
/**
 * 工具集
 * @class Utils
 * @module mokit
 */
(function (owner) {
    "require:nomunge,exports:nomunge,module:nomunge";
    "use strict";

    /**
     * 验证一个对象是否为NULL
     * @method isNull
     * @param  {Object}  obj 要验证的对象
     * @return {Boolean}     结果
     * @static
     */
    owner.isNull = function (obj) {
        return obj === null || typeof obj === "undefined";
    };

    /**
     * 除去字符串两端的空格
     * @method trim
     * @param  {String} str 源字符串
     * @return {String}     结果字符串
     * @static
     */
    owner.trim = function (str) {
        if (this.isNull(str)) return str;
        if (str.trim) {
            return str.trim();
        }
        else {
            return str.replace(/(^[\\s]*)|([\\s]*$)/g, "");
        }
    };

    /**
     * 替换所有
     * @method replace
     * @param {String} str 源字符串
     * @param {String} str1 要替换的字符串
     * @param {String} str2 替换为的字符串
     * @static
     */
    owner.replace = function (str, str1, str2) {
        if (this.isNull(str)) return str;
        return str.replace(new RegExp(str1, 'g'), str2);
    };

    /**
     * 从字符串开头匹配
     * @method startWith
     * @param {String} str1 源字符串
     * @param {String} str2 要匹配的字符串
     * @return {Boolean} 匹配结果
     * @static
     */
    owner.startWith = function (str1, str2) {
        if (this.isNull(str1) || this.isNull(str2)) return false;
        return str1.indexOf(str2) === 0;
    };

    /**
     * 是否包含
     * @method contains
     * @param {String} str1 源字符串
     * @param {String} str2 检查包括字符串
     * @return {Boolean} 结果
     * @static
     */
    owner.contains = function (str1, str2) {
        var self = this;
        if (this.isNull(str1) || this.isNull(str2)) return false;
        if (self.isArray(str1)) {
            return self.each(str1, function (i, str) {
                if (str == str2) return true;
            });
        } else {
            return str1 && str2 && str1.indexOf(str2) > -1;
        }
    };

    /**
     * 从字符串结束匹配
     * @method endWidth
     * @param {String} str1 源字符串
     * @param {String} str2 匹配字符串
     * @return {Boolean} 匹配结果
     * @static
     */
    owner.endWith = function (str1, str2) {
        if (this.isNull(str1) || this.isNull(str2)) return false;
        return str1.indexOf(str2) === (str1.length - str2.length);
    };

    /**
     * 是否包含属性
     * @method hasProperty
     * @param  {Object}  obj  对象
     * @param  {String}  name 属性名
     * @return {Boolean}      结果
     * @static
     */
    owner.has = owner.hasProperty = function (obj, name) {
        if (this.isNull(obj) || this.isNull(name)) return false;
        return (name in obj) || (obj.hasOwnProperty(name));
    };

    /**
     * 验证一个对象是否为Function
     * @method isFunction
     * @param  {Object}  obj 要验证的对象
     * @return {Boolean}     结果
     * @static
     */
    owner.isFunction = function (obj) {
        if (this.isNull(obj)) return false;
        return typeof obj === "function";
    };

    /**
     * 验证一个对象是否为String
     * @method isString
     * @param  {Object}  obj 要验证的对象
     * @return {Boolean}     结果
     * @static
     */
    owner.isString = function (obj) {
        if (this.isNull(obj)) return false;
        return typeof obj === 'string' || obj instanceof String;
    };

    /**
     * 验证一个对象是否为Number
     * @method isNumber
     * @param  {Object}  obj 要验证的对象
     * @return {Boolean}     结果
     * @static
     */
    owner.isNumber = function (obj) {
        if (this.isNull(obj)) return false;
        return typeof obj === 'number' || obj instanceof Number;
    };

    /**
     * 验证一个对象是否为HTML Element
     * @method isElement
     * @param  {Object}  obj 要验证的对象
     * @return {Boolean}     结果
     * @static
     */
    owner.isElement = function (obj) {
        if (this.isNull(obj)) return false;
        if (window.Element) return obj instanceof Element;
        else return (obj.tagName && obj.nodeType && obj.nodeName && obj.attributes && obj.ownerDocument);
    };

    /**
     * 验证一个对象是否为HTML Text Element
     * @method isText
     * @param  {Object}  obj 要验证的对象
     * @return {Boolean}     结果
     * @static
     */
    owner.isText = function (obj) {
        if (this.isNull(obj)) return false;
        return obj instanceof Text;
    };

    /**
     * 验证一个对象是否为Object
     * @method isObject
     * @param  {Object}  obj 要验证的对象
     * @return {Boolean}     结果
     * @static
     */
    owner.isObject = function (obj) {
        if (this.isNull(obj)) return false;
        return typeof obj === "object";
    };

    /**
     * 验证一个对象是否为Array或伪Array
     * @method isArray
     * @param  {Object}  obj 要验证的对象
     * @return {Boolean}     结果
     * @static
     */
    owner.isArray = function (obj) {
        if (this.isNull(obj)) return false;
        var _isArray = ((obj instanceof Array) || (!this.isString(obj) && obj.length && this.isNumber(obj.length)));
        return _isArray;
    };

    /**
     * 验证是不是一个日期对象
     * @method isDate
     * @param {Object} val   要检查的对象
     * @return {Boolean}           结果
     * @static
     */
    owner.isDate = function (val) {
        if (this.isNull(val)) return false;
        return val instanceof Date;
    };

    /**
     * 转换为数组
     * @method toArray
     * @param {Array|Object} _aar 伪数组
     * @return {Array} 转换结果数组
     * @static
     */
    owner.toArray = function (_aar) {
        if (this.isNull(_aar)) return [];
        try {
            return Array.prototype.slice.call(_aar);
        } catch (e) {
            var arr = [];
            var lan = _aar.length;
            for (var i = 0; i < len; i++) {
                arr[i] = s[i];
            }
            return arr;
        }
    };

    /**
     * 转为日期格式
     * @method toDate
     * @param {Number|String} val 日期字符串或整型数值
     * @return {Date} 日期对象
     * @static
     */
    owner.toDate = function (val) {
        var self = this;
        if (self.isNumber(val))
            return new Date(val);
        else if (self.isString(val))
            return new Date(self.replace(self.replace(val, '-', '/'), 'T', ' '));
        else if (self.isDate(val))
            return val;
        else
            return null;
    };

    /**
     * 遍历一个对像或数组
     * @method each
     * @param  {Object or Array}   obj  要遍历的数组或对象
     * @param  {Function} fn            处理函数
     * @return {void}                   无返回值
     * @static
     */
    owner.each = function (list, handler) {
        if (this.isNull(list) || this.isNull(handler)) return;
        if (this.isArray(list)) {
            var listLength = list.length;
            for (var i = 0; i < listLength; i++) {
                if (this.isNull(list[i])) continue;
                var rs = handler.call(list[i], i, list[i]);
                if (!this.isNull(rs)) return rs;
            }
        } else {
            for (var key in list) {
                if (this.isNull(list[key])) continue;
                var rs = handler.call(list[key], key, list[key]);
                if (!this.isNull(rs)) return rs;
            }
        }
    };

    /**
     * 格式化日期
     * @method formatDate
     * @param {Date|String|Number} date 日期
     * @param {String} format 格式化字符串
     * @return {String} 格式化结果
     * @static
     */
    owner.formatDate = function (date, format) {
        if (this.isNull(format) || this.isNull(date)) return date;
        date = this.toDate(date);
        var placeholder = {
            "M+": date.getMonth() + 1, //month
            "d+": date.getDate(), //day
            "h+": date.getHours(), //hour
            "m+": date.getMinutes(), //minute
            "s+": date.getSeconds(), //second
            "q+": Math.floor((date.getMonth() + 3) / 3), //quarter
            "S": date.getMilliseconds() //millisecond
        }
        if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var key in placeholder)
            if (new RegExp("(" + key + ")").test(format))
                format = format.replace(RegExp.$1,
                    RegExp.$1.length == 1 ? placeholder[key] :
                    ("00" + placeholder[key]).substr(("" + placeholder[key]).length));
        return format;
    };

    /**
     * 深度克隆对象
     * @method clone
     * @param {Object} obj 源对象
     * @return {Object} 新对象
     * @static
     */
    owner.clone = function (obj) {
        if (this.isNull(obj)) return null;
        var objClone = new obj.constructor();
        for (var key in obj) {
            if (objClone[key] != obj[key]) {
                if (typeof (obj[key]) === 'object') {
                    objClone[key] = this.clone(obj[key]);
                } else {
                    objClone[key] = obj[key];
                }
            }
        }
        objClone.toString = obj.toString;
        objClone.valueOf = obj.valueOf;
        return objClone;
    };

    /**
     * 拷贝对象
     * @method copy
     * @param {Object} obj1 源对象
     * @param {Object} obj2 目标对象
     * @static
     */
    owner.copy = function (obj1, obj2) {
        obj2 = obj2 || {};
        this.each(obj1, function (name) {
            obj2[name] = obj1[name];
        })
        return obj2;
    };

    /**
     * 生成一个Guid
     * @method newGuid
     * @return {String} GUID字符串
     * @static
     */
    owner.newGuid = function () {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    };

    /**
     * 定义属性
     * @method defineProperty
     * @param {Object} obj 对象
     * @param {String} name 属性名
     * @param {Object} context 属性定义
     * @param {Boolean} compatible 是否使用兼容方式
     * @static
     */
    owner.defineProperty = function (obj, name, context, compatible) {
        if (!obj || !name || !context) return;
        var self = this;
        context.set = context.set || function () {
            throw 'do not implement ' + name + ' setter.';
        };
        context.get = context.get || function () {
            throw 'do not implement ' + name + ' getter.';
        };
        //--
        if (!compatible) {
            if (obj.__defineGetter__ && obj.__defineSetter__) {
                obj.__defineSetter__(name, context.set);
                obj.__defineGetter__(name, context.get);
            } else if (Object.defineProperty) {
                try {
                    Object.defineProperty(obj, name, context);
                } catch (ex) { }
            }
        }
        //--
        if (!self.has(obj, name)) {
            obj[name] = function (value) {
                var method = self.isNull(value) ? 'get' : 'set';
                return context[method].apply(obj, arguments || []);
            };
        }
        return obj[name];
    };

    /**
     * 处理URL
     * @method wrapUrl
     * @param  {String} _url 原始URL
     * @return {String}      处理过的URL
     * @static
     */
    owner.wrapUrl = function (url) {
        if (this.isNull(url)) return url;
        if (url.indexOf('?') > -1) {
            url += "&__t=" + this.newGuid();
        } else {
            url += "?__t=" + this.newGuid();
        }
        return url;
    };

    /**
     * 休眼
     * @method sleep
     * @param {Number} s 休眠时间（毫秒）
     * @static
     */
    owner.sleep = function (s) {
        var time = (new Date()).getTime() + s;
        while ((new Date()).getTime() + 1 < time);
        return;
    };

    /**
     * 异步执行一个函数（模拟多线程）
     * @method async
     * @param {Function} fn 执行的函数
     * @param {Number} dely 延迟时间（毫秒）
     * @static
     */
    owner.async = function (fn, delay) {
        if (!this.isFunction(fn)) return;
        delay = delay || 0;
        if (fn.asyncTimer) clearTimeout(fn.asyncTimer);
        fn.asyncTimer = setTimeout(fn, delay);
        return fn.asyncTimer;
    };

    /**
     * 弹出一个select列表
     * @method openSelect
     * @param  {Element} element select元素
     * @return {void}         无返回值
     */
    owner.openSelect = function (element) {
        if (!this.isElement(element)) return;
        var worked = false;
        if (document.createEvent) { // all browsers
            var e = document.createEvent("MouseEvents");
            e.initMouseEvent("mousedown", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            worked = element.dispatchEvent(e);
        } else if (element.fireEvent) { // ie
            worked = element.fireEvent("onmousedown");
        }
        if (!worked) { // unknown browser / error
            alert("It didn't worked in your browser.");
        }
    };

    //----

    //兼容AMD模块
    if (typeof define === 'function' && define.amd) {
        define('$utils', [], function () {
            return owner;
        });
    }

})((typeof exports === 'undefined') ? (window.$utils = {}) : exports);
//-