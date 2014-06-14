/**
 * 事件模块
 * @class Event
 * @module mokit
 */
(function (owner) {
    "require:nomunge,exports:nomunge,module:nomunge";
    "use strict";

    /** 
     * 为对象定义一个事件
     * @method create
     * @param  {Object} src      要添加事件的对象
     * @param  {String} name     事件名称
     * @param  {BindType} bindType 事件绑定类型
     * @return {Event}           定义的事件
     * @static
     */
    owner.create = function (src, name, bindType) {
        //默认为当前对象，如果没有在一个自定义对象中使用，this指向的是window
        var me = this;
        //默契第一个参数据事件名，第二个为对象
        if (src && owner.utils.isString(name)) me = src;
        //为了支持第一个参数为对象，第二个参为事件名的写法
        if (name && owner.utils.isString(src)) {
            me = name;
            name = src;
        }
        //事件存放列表
        if (!me._eventList) me._eventList = {};
        //如果事件不存则添加
        if (!me._eventList[name]) {
            me._eventList[name] = [];
            //用以支持系统对象的系统事件
            me.addEventListener = me.addEventListener || function (name, fn, useCapture) {
                if (me.attachEvent) me.attachEvent("on" + name, fn);
            };
            me.removeEventListener = me.removeEventListener || function (name, fn, useCapture) {
                if (me.detachEvent) me.detachEvent("on" + name, fn);
            };
            //处理绑定类型
            if (bindType == null && bindType != 0) {
                if (owner.utils.isArray(me) && !owner.utils.isElement(me)) bindType = owner.bindType.child;
                else bindType = owner.bindType.self;
            }
            //实现对数组批量支持(支持数组及伪数组),迭代器
            me._each = function (fn, _bindType) {
                if (owner.utils.isArray(me) && !owner.utils.isElement(me) && owner.bindType.self != _bindType && me[0]) {
                    owner.utils.each(me, fn);
                }
                return me;
            }
            //如果指定的事件已经定义过，则将原有定义转存$+name形式备用
            if (me[name]) me["$" + name] = me[name];
            /**
             * 添加一个事件处理或触事件
             * @param  {Function} fn  事件处理函数
             * @param  {Object}   obj 处理函数据的作用域对象
             * @return {void}         无返回值
             */
            me[name] = function (fn, obj) {
                if (fn && owner.utils.isFunction(fn)) me[name].bind(fn, obj);
                else me[name].trigger.apply(me[name], arguments);
                return me;
            };
            /**
             * 清空事件处理函数
             * @return {void} 无返回值
             */
            me[name].clear = function () {
                //如果是数组或伪数组
                me._each(function () {
                    owner.create(name, this).clear();
                }, bindType);
                //
                me._eventList[name] = [];
                return me;
            };
            /**
             * 验证一个处理函数是否已经添加
             * @param  {Function} fn 处理函数
             * @return {Boolean}     Bool值
             */
            me[name].has = function (fn) {
                var list = me._eventList[name];
                for (var i = 0; i < list.length; i++) {
                    if (list[i] == fn) return true;
                }
            };
            /**
             * 添加（绑定）一个事件处理函数
             * @param  {Function} fn  处理函数
             * @param  {Object}   obj 处理函数作用对象
             * @return {void}         无运回值
             */
            me[name].add = me[name].bind = function (fn, obj) {
                //如果是数组或伪数组
                me._each(function () {
                    owner.create(name, this).add(fn, obj);
                }, bindType);
                //
                if (me[name].has(fn) || owner.bindType.child == bindType) return me;
                fn._src = obj;
                me._eventList[name].push(fn);
                //如果为系统对象支持系统事件
                if (me.addEventListener && me.removeEventListener) {
                    fn.$invoke = function (event) {
                        var rs = fn.apply(me, arguments);
                        if (rs === false) { //阻止事件冒泡
                            if (event.cancelBubble) event.cancelBubble = true;
                            if (event.preventDefault) event.preventDefault();
                            if (event.stopPropagation) event.stopPropagation();
                        }
                    }
                    me.addEventListener(name, fn.$invoke, false);
                }
                return me;
            };
            /**
             * 移除（解绑）一个事件处理函数
             * @param  {Function} fn 处理函数
             * @return {void}     无返回值
             */
            me[name].remove = me[name].unbind = function (fn) {
                //如果是数组或伪数组
                me._each(function () {
                    owner.create(name, this).remove(fn);
                }, bindType);
                //
                if (owner.bindType.child == bindType) return me;
                //
                if (me.addEventListener && me.removeEventListener) {
                    me.removeEventListener(name, fn.$invoke);
                }
                //
                var newEventList = [];
                owner.utils.each(me._eventList[name], function (i, item) {
                    if (item != fn) {
                        newEventList.push(item);
                    }
                });
                me._eventList[name] = newEventList;
                return me;
            };
            /*
             * 触发一个事件
             * @return {void} 无返回值
             */
            me[name].trigger = me[name].fire = function () {
                /// <summary>触发</summary>
                var args = arguments;
                //如果是数组或伪数组
                me._each(function () {
                    owner.create(name, this).trigger.apply(this[name], args);
                }, bindType);
                //  
                if (me["$" + name]) {
                    me["$" + name].apply(me, args);
                    return;
                }
                //
                owner.utils.each(me._eventList[name], function (i, item) {
                    if (me._eventList[name][i] != null) {
                        var src = me._eventList[name][i]._src;
                        if (src == null) src = me;
                        if (src) me._eventList[name][i].apply(src, args);
                    }
                });
                return me;
            };
        }
        //返回事件
        return me[name];
    };

    /**
     * 事件绑定类型
     * @property {enum} bindType
     */
    owner.bindType = {
        self: 0,
        child: 1,
        all: 2
    };

    //兼容AMD模块
    if (typeof define === 'function' && define.amd) {
        define('$event', 'utils', function (utils) {
            owner.utils = utils;
            return owner;
        });
    } else {
        owner.utils = $utils;
    }

})((typeof exports === 'undefined') ? (window.$event = {}) : exports);
//