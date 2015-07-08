/**
 * 类型工厂，用来创建一个类型（class）,类似是java中的class关键字。
 * @class Class
 * @module mokit
 */
(function(owner) {
    "require:nomunge,exports:nomunge,module:nomunge";
    "use strict";

    var utils = require('./utils');

    var igonreArray = ['__scope__'];

    /**
     * 复制对象
     */
    var copyApply = function(src, tag, $visit) {
        tag = tag || {};
        utils.each(src, function(name, item) {
            if (utils.contains(igonreArray, name)) return;
            if (utils.isFunction(item)) {
                //生成作用在子类的继承方法
                tag[name] = function() {
                    return item.apply(tag.__scope__ || this, arguments);
                };
                //记录最原始的方法
                tag[name].original = item.original || item;
                if ($visit) {
                    //通过 $ 访问作用在父类对象的原方法
                    tag["$" + name] = item;
                }
            } else {
                tag[name] = utils.clone(item, igonreArray);
            }
        });
        return tag;
    };

    var rootClass = function() {};

    /**
     * 定义一个class(类)，可以继承方法和属性（但不包括在子类里动态创建的）
     * @method create
     * @param {Class} _base 基类（可以省略）
     * @param {Object} _class 类型声明（可以省略，省略_class时,_base就是“类型声明”）
     */
    owner.create = function(_baseClass, _class) {
        if (!_class) {
            _class = _baseClass;
            _baseClass = null;
        };
        _baseClass = _baseClass || rootClass;
        _class = _class || {};
        var _baseInstanse = utils.isFunction(_baseClass) ? new _baseClass() : _baseClass;
        var _classInstanse = utils.isFunction(_class) ? new _class() : _class;
        //创建类型
        var theClass = function() {
            this.$base.__scope__ = this;
            //重置实例，避免不应该出现的共享成员
            copyApply(this, this);
            //调用构造
            if (this.initialize) {
                var rs = this.initialize.apply(this, arguments);
                return rs;
            }
        };
        //处理父子关系，通过prototype将父类成员添加到原型，可以使typeof instanseOf有效;
        theClass.baseClass = _baseClass;
        theClass.prototype = _baseInstanse;
        theClass.prototype.$base = copyApply(utils.clone(_baseInstanse, igonreArray), {}, true); //clone一份父类的成员;
        theClass.prototype.base = theClass.prototype.$base;
        theClass.prototype.$type = theClass;
        //定义实例扩展函数
        theClass.extend = function(context, initFunc) {
            //如果是一个类，则创建实例
            if (utils.isFunction(context)) {
                context = new context();
            }
            //如果存在初始化函数
            if (utils.isFunction(context[initFunc])) {
                context[initFunc]();
            }
            return copyApply(context, this.prototype);
        };
        theClass.copy = function(context, initFunc) {
            //如果存在初始化函数
            if (utils.isFunction(context[initFunc])) {
                context[initFunc]();
            }
            return copyApply(context, this);
        };
        //处理实例成员
        //theClass.extend(_baseInstanse);
        theClass.extend(_classInstanse);
        //处理静态成员
        if (utils.isFunction(_baseClass)) {
            theClass.copy(_baseClass);
        };
        if (utils.isFunction(_class)) {
            theClass.copy(_class);
        };
        //返回创建好的类型
        return theClass;
    };

})(exports);
//