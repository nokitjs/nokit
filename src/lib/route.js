// ems2node 
if (typeof define !== 'function' && module && module.require && module.exports) {
    var define = require('./amd2node').define(module);
}

/**
 * 路由控制器
 * @class Route
 * @module mokit
 */
define(function(require, exports, module) {
    "require:nomunge,exports:nomunge,module:nomunge";
    "use strict";

    var utils = require("./utils");

    /**
     * 路由表
     */
    var routeTable = [];

    /**
     * 占位符
     */
    var placeHolderExp = new RegExp('\{.+?\}', 'gim');

    /**
     * 通过请求路径获取第一个匹配的路由
     * @param  {String} pathName 请求路径
     * @return {Route}           路由实体
     * @method getRoute
     * @static
     */
    exports.getRoute = function(pathName) {
        for (var i = 0; i < routeTable.length; i++) {
            var route = routeTable[i];
            route.matchExp.lastIndex = 0;
            if (route.matchExp.test(pathName)) {
                route.routeData = {};
                route.matchExp.lastIndex = 0;
                var routeValues = pathName.match(route.matchExp);
                for (var j = 0; j < route.routeKeys.length; j++) {
                    var routeVal = RegExp['$' + (j + 1)];
                    if (routeVal) {
                        route.routeData[route.routeKeys[j]] = routeVal;
                    }
                };
                return utils.clone(route);
            }
        }
    };

    /**
     * 添加一个路由配置
     */
    var addOneRoute = function(route) {
        if (route && route.pattern && route.target) {
            placeHolderExp.lastIndex = 0;
            //生成url匹配测试表达式 ，将“占位符”的表达式，替换为 “任意非‘/’” 的表达式
            var matchString = '^' + route.pattern.replace(placeHolderExp, '([^\\/]+)') + '$';
            route.matchExp = new RegExp(matchString, 'gim');
            //取到所有路由key
            route.routeKeys = route.pattern.match(placeHolderExp) || [];
            for (var i = 0; i < route.routeKeys.length; i++) {
                route.routeKeys[i] = route.routeKeys[i].replace('{', '').replace('}', '');
            };
            routeTable.push(route);
        }
    };

    /**
     * 添加一个路由
     * @param {Route} route 一个路由实体,格式:{pattern:'',target:object}
     * @param {Module} srcModule 当前模块
     * @method addRoute
     * @static
     */
    exports.addRoute = function(routes, srcModule) {
        if (!utils.isArray(routes)) routes = [routes];
        utils.each(routes, function(i) {
            this.target = (srcModule && srcModule.resovleUri) ? srcModule.resovleUri(this.target) : this.target;
            addOneRoute(this);
        })
    };

})