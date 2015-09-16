var console = require("./console");
var utils = module.require("./utils");

/**
 * 占位符正则表达式
 */
var placeHolderExp = new RegExp('\{.+?\}', 'gim');

/**
 * 定义路由对象
 */
function Routing(routes) {
    var self = this;
    if (routes) {
        self.add(routes);
    }
};

/**
 * 路由表
 */
Routing.prototype.table = [];

/**
 * 通过请求路径获取第一个匹配的路由
 * @param  {String} url 请求路径
 * @return {Route}           路由实体
 * @method get
 * @static
 */
Routing.prototype.get = function(url) {
    var self = this;
    for (var i = 0; i < self.table.length; i++) {
        var route = self.table[i];
        route.matchExp.lastIndex = 0;
        if (route.matchExp.test(url)) {
            route.data = {};
            route.matchExp.lastIndex = 0;
            var values = url.match(route.matchExp);
            for (var j = 0; j < route.keys.length; j++) {
                var routeVal = RegExp['$' + (j + 1)];
                if (routeVal) {
                    route.data[route.keys[j]] = routeVal;
                }
            };
            return utils.clone(route);
        }
    }
};

/**
 * 添加一个路由配置
 */
Routing.prototype._add = function(route) {
    var self = this;
    if (route && route.pattern && route.target) {
        placeHolderExp.lastIndex = 0;
        //生成url匹配测试表达式 ，将“占位符”的表达式，替换为 “任意非‘/’” 的表达式
        var matchString = '^' + route.pattern.replace(placeHolderExp, '([^\\/]+)') + '$';
        route.matchExp = new RegExp(matchString, 'gim');
        //取到所有路由key
        route.keys = route.pattern.match(placeHolderExp) || [];
        for (var i = 0; i < route.keys.length; i++) {
            route.keys[i] = route.keys[i].replace('{', '').replace('}', '');
        };
        self.table.push(route);
    }
};

/**
 * 添加一个路由
 * @param {Route} route 一个路由实体,格式:{pattern:'',target:object}
 * @param {Module} srcModule 当前模块
 * @method addRoute
 * @static
 */
Routing.prototype.add = function(routes, srcModule) {
    var self = this;
    if (!utils.isArray(routes)) routes = [routes];
    utils.each(routes, function(i) {
        this.target = (srcModule && srcModule.resovleUri) ? srcModule.resovleUri(this.target) : this.target;
        self._add(this);
    })
};

module.exports = Routing;

/*end*/