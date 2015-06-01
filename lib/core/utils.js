var fs = require('fs');
var tp = require('./tp');

var owner = exports;

/**
 * 验证一个对象是否为NULL
 * @method isNull
 * @param  {Object}  obj 要验证的对象
 * @return {Boolean}     结果
 * @static
 */
owner.isNull = function(obj) {
    return obj === null || typeof obj === "undefined";
};

/**
 * 除去字符串两端的空格
 * @method trim
 * @param  {String} str 源字符串
 * @return {String}     结果字符串
 * @static
 */
owner.trim = function(str) {
    if (this.isNull(str)) return str;
    if (str.trim) {
        return str.trim();
    } else {
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
owner.replace = function(str, str1, str2) {
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
owner.startWith = function(str1, str2) {
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
owner.contains = function(str1, str2) {
    var self = this;
    if (this.isNull(str1) || this.isNull(str2)) return false;
    if (owner.isArray(str1)) {
        return owner.each(str1, function(i, str) {
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
owner.endWith = function(str1, str2) {
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
owner.has = owner.hasProperty = function(obj, name) {
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
owner.isFunction = function(obj) {
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
owner.isString = function(obj) {
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
owner.isNumber = function(obj) {
    if (this.isNull(obj)) return false;
    return typeof obj === 'number' || obj instanceof Number;
};

/**
 * 验证一个对象是否为Boolean
 * @method isBoolean
 * @param  {Object}  obj 要验证的对象
 * @return {Boolean}     结果
 * @static
 */
owner.isBoolean = function(obj) {
    if (this.isNull(obj)) return false;
    return typeof obj === 'boolean' || obj instanceof Boolean;
};

/**
 * 验证一个对象是否为HTML Element
 * @method isElement
 * @param  {Object}  obj 要验证的对象
 * @return {Boolean}     结果
 * @static
 */
owner.isElement = function(obj) {
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
owner.isText = function(obj) {
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
owner.isObject = function(obj) {
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
owner.isArray = function(obj) {
    if (this.isNull(obj)) return false;
    var v1 = Object.prototype.toString.call(obj) === '[object Array]';
    var v2 = obj instanceof Array;
    var v3 = !this.isString(obj) && this.isNumber(obj.length) && this.isFunction(obj.splice);
    var v4 = !this.isString(obj) && this.isNumber(obj.length) && obj[0];
    return v1 || v2 || v3 || v4;
};

/**
 * 验证是不是一个日期对象
 * @method isDate
 * @param {Object} val   要检查的对象
 * @return {Boolean}           结果
 * @static
 */
owner.isDate = function(val) {
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
owner.toArray = function(_aar) {
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
owner.toDate = function(val) {
    var self = this;
    if (owner.isNumber(val))
        return new Date(val);
    else if (owner.isString(val))
        return new Date(owner.replace(owner.replace(val, '-', '/'), 'T', ' '));
    else if (owner.isDate(val))
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
owner.each = function(list, handler) {
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
owner.formatDate = function(date, format) {
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
    if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var key in placeholder) {
        if (new RegExp("(" + key + ")").test(format)) {
            format = format.replace(RegExp.$1,
                RegExp.$1.length == 1 ? placeholder[key] :
                ("00" + placeholder[key]).substr(("" + placeholder[key]).length));
        }
    }
    return format;
};

/**
 * 深度克隆对象
 * @method clone
 * @param {Object} obj 源对象
 * @return {Object} 新对象
 * @static
 */
owner.clone = function(obj, igonreArray) {
    if (this.isNull(obj) || this.isString(obj) || this.isNumber(obj) || this.isBoolean(obj) || this.isDate(obj)) {
        return obj;
    }
    var objClone = obj;
    try {
        objClone = new obj.constructor();
    } catch (ex) {}
    for (var key in obj) {
        if (objClone[key] != obj[key] && !this.contains(igonreArray, key)) {
            if (typeof(obj[key]) === 'object') {
                objClone[key] = this.clone(obj[key], igonreArray);
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
owner.copy = function(obj1, obj2) {
    obj2 = obj2 || {};
    this.each(obj1, function(name) {
        try {
            obj2[name] = obj1[name];
        } catch (ex) {}
    })
    return obj2;
};

/**
 * 生成一个Guid
 * @method newGuid
 * @return {String} GUID字符串
 * @static
 */
owner.newGuid = function() {
    var S4 = function() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};

/**
 * 合并对象
 * @method mix
 * @return 合并后的对象
 * @param {Object} r 目标对象
 * @param {Object} s 源对象
 * @param {Boolean} ov 是否覆盖
 * @param {Object} wl 白名单
 * @param {Number} mode 模式
 * @param {Boolean} merge 深度合并
 */
owner.mix = function(r, s, ov, wl, mode, merge) {
    if (!s || !r) {
        return r || owner;
    }
    //根据模式来判断，默认是Obj to Obj的  
    if (mode) {
        switch (mode) {
            case 1: // proto to proto  
                return owner.mix(r.prototype, s.prototype, ov, wl, 0, merge);
            case 2: // object to object and proto to proto  
                owner.mix(r.prototype, s.prototype, ov, wl, 0, merge);
                break; // pass through  
            case 3: // proto to static  
                return owner.mix(r, s.prototype, ov, wl, 0, merge);
            case 4: // static to proto  
                return owner.mix(r.prototype, s, ov, wl, 0, merge);
            default: // object to object is what happens below  
        }
    }
    // Maybe don't even need this wl && wl.length check anymore??  
    var i, l, p, type;
    //白名单如果有值，就对白名单里面的属性进行合并，如果有ov，那么就  
    if (wl && wl.length) {
        for (i = 0, l = wl.length; i < l; ++i) {
            p = wl[i];
            isObject = owner.isObject(r[p]); //看具体的属性是什么类型的  
            if (s.hasOwnProperty(p)) { //如果这个属性是p自己的  
                if (merge && isObject) { //如果设定了merge并且属性是一个对象，那么就调用mix本身，把s[p]的属性加到r[p]上面  
                    owner.mix(r[p], s[p]);
                } else if (ov || !(p in r)) { //如果允许ov或者r里面没有p，那么就在r里面加上p这个属性  
                    r[p] = s[p];
                }
            }
        }
    } else { //如果没有wl  
        for (i in s) { //遍历s里面的属性  
            if (s.hasOwnProperty(i)) { //如果i是s本身的属性，就按规则合并属性  
                if (merge && owner.isObject(r[i], true)) {
                    owner.mix(r[i], s[i], ov, wl, 0, true); // recursive  
                } else if (ov || !(i in r)) {
                    r[i] = s[i];
                }
            }
        }
    }
    return r;
};

/***** 以上来自 mokit/utils *****/

/**
 * 首字母大写
 */
owner.firstUpper = function(str) {
    var self = this;
    if (self.isNull(str)) return;
    str = str.toLowerCase();
    var buffer = [];
    for (var i in str) {
        if (i == 0) {
            buffer.push(str[i].toUpperCase());
        } else {
            buffer.push(str[i]);
        }
    };
    return buffer.join('');
};

/**
 * 同步读取 JSON
 **/
owner.readJSONSync = function(jsonFile) {
    if (fs.existsSync(jsonFile)) {
        var jsonText = fs.readFileSync(jsonFile);
        return JSON.parse(jsonText);
    } else {
        return null;
    }
};

/**
 * 编译一个模板
 **/
owner.compileTemplateSync = function(templateFile) {
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
owner.copyDir = function(src, dst) {
    var self = this;
    if (fs.existsSync(src)) {
        if (!fs.existsSync(dst)) {
            fs.mkdirSync(dst);
        }
        var files = fs.readdirSync(src);
        files.forEach(function(file, index) {
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