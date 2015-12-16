var console = require("./console");
var utils = module.require("./utils");

/**
 * 占位符正则表达式
 */
var placeHolderExp = new RegExp('\{.+?\}', 'gim');

/**
 * 定义路由对象
 */
function Router(routes) {
    var self = this;
    self.table = [];
    if (routes) {
        self.add(routes);
    }
};

/**
 * 通过请求路径获取第一个匹配的路由
 * @param  {String} url 请求路径
 * @return {Route}           路由实体
 * @method get
 * @static
 */
Router.prototype.get = function (url) {
    var self = this;
    url = utils.isNull(url) ? "" : url;
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
            route = utils.clone(route);
            route.url = url;
            return route;
        }
    }
};

/**
 * 添加一个路由配置
 */
Router.prototype._add = function (route) {
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
Router.prototype.add = function (routes, srcModule) {
    var self = this;
    utils.each(routes, function (name, _route) {
        var route = utils.isString(_route) ? { "target": _route } : _route;
        var nameParts = name.toString().split('::');
        route.pattern = route.pattern || nameParts[0];
        route.target = (srcModule && srcModule.resovleUri) ? srcModule.resovleUri(route.target) : route.target;
        if (nameParts[1]) {
            route.methods = nameParts[1].split(",");
        }
        //转成大写
        if (route.methods && route.methods.length > 0) {
            route.methods = route.methods.map(function (method) {
                return method.toUpperCase();
            });
        }
        route.action = route.action || nameParts[2];
        self._add(route);
    })
};

module.exports = Router;

/*end*/