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
 * 给 route 对象附加一些功能
 **/
Router.prototype._attachToRoute = function (route) {
    /**
     * 生成 action URL
     **/
    route.actionUrl = function (action) {
        var route = this;
        var url = route.url + "/" + action;
        url = url.replace(/\/\//igm, "/");
        return url;
    };
    return route;
};

/**
 * 添加一个路由配置
 */
Router.prototype.addOne = function (route) {
    var self = this;
    if (route && route.pattern) {
        placeHolderExp.lastIndex = 0;
        //生成url匹配测试表达式 ，将“占位符”的表达式，替换为 “任意非‘/’” 的表达式
        var matchString = '^' + route.pattern.replace(placeHolderExp, '([^\\/]+)') + '$';
        route.matchExp = new RegExp(matchString, 'gim');
        //取到所有路由key
        route.keys = route.pattern.match(placeHolderExp) || [];
        for (var i = 0; i < route.keys.length; i++) {
            route.keys[i] = route.keys[i].replace('{', '').replace('}', '');
        };
        self._attachToRoute(route);
        //将所有 mthod 转成大写
        if (route.methods && route.methods.length > 0) {
            route.methods = route.methods.map(function (method) {
                return method.toUpperCase();
            });
        }
        self.table.push(route);
    }
};

/**
 * 添加路由配置表
 * @param {Route} route 一个路由实体,格式:{pattern:'',target:object}
 * @method addRoute
 * @static
 */
Router.prototype.add = function (routes, srcModule) {
    var self = this;
    utils.each(routes, function (name, _route) {
        //判断是字符串还是一个对象，并都将 _route 转为对象
        var route = utils.isString(_route) ? { "target": _route } : _route;
        //尝试从名称中解析出 method 和 pattern
        var nameParts = name.toString().split(' ');
        if (nameParts.length > 1) {
            route.methods = nameParts[0].split(",");
            route.pattern = route.pattern || nameParts[1];
        } else {
            route.pattern = route.pattern || nameParts[0];
        }
        //解析 controller 和 action
        //target 和 controller 不可同时配置，target 可以为 "controller action" 这样的格式
        if (route.target) {
            var targetParts = route.target.split(' ');
            route.controller = route.controller || targetParts[0];
            route.action = route.action || targetParts[1];
        }
        route.target = route.controller;
        //添加 route
        self.addOne(route);
    })
};

/**
 * 解析路由动态 action
 **/
Router.prototype._parseDynamicAction = function (route) {
    if (route &&
        route.action &&
        route.action.indexOf('{') > -1 &&
        route.action.indexOf('}') > -1) {
        utils.each(route.data, function (key, val) {
            route.action = utils.replace(route.action, "{" + key + "}", val);
        });
    }
    return route;
};

/**
 * 通过请求路径获取第一个匹配的路由
 * @param  {String} url 请求路径
 * @return {Route}           路由实体
 * @method get
 * @static
 */
Router.prototype.get = function (url, tryResolveUrl) {
    var self = this;
    if (tryResolveUrl) {
        return self.getByResolveUrl(url);
    }
    url = utils.isNull(url) ? "" : url;
    for (var i = 0; i < self.table.length; i++) {
        var route = self.table[i];
        route.matchExp.lastIndex = 0;
        if (route.matchExp.test(url)) {
            var routeData = {};
            route.matchExp.lastIndex = 0;
            //通过子表达式取值 RegExp.$1-9 (一个路由配置最多有 9 个占位符变量)
            url.match(route.matchExp);
            for (var j = 0; j < route.keys.length; j++) {
                var routeVal = RegExp['$' + (j + 1)];
                if (routeVal) {
                    routeData[route.keys[j]] = routeVal;
                }
            };
            //clone route 对象
            var routeClone = utils.clone(route);
            routeClone.url = url;
            routeClone.data = routeData;
            routeClone = self._parseDynamicAction(routeClone);
            return routeClone;
        }
    }
};

//匹配路由
Router.prototype.getByResolveUrl = function (url) {
    var self = this;
    url = url.replace(/\/\//igm, "/");
    var route = self.get(url);
    //如果直接成功匹配
    if (route) return route;
    /*
    如果直接匹配不成功，
    则将 “/” 分隔的最后一个 “字串” 当作 action 进行再一次匹配
    */
    var urlParts = url.split('/');
    var lastIndex = urlParts.length - 1;
    var action = urlParts[lastIndex];
    //检查分解出来的 action 是否合法
    if (action === "" || action.indexOf('.') > -1) {
        return null;
    }
    var newUrl = urlParts.slice(0, lastIndex).join('/');
    if (newUrl === '') newUrl = "/"
    route = self.get(newUrl);
    //如果查找到
    if (route) {
        /**
         * 从 URL 分解出来的 action 不可能是动态的 action
         * 必须用分解出来的 action 覆盖原有 action，不然将有可能路由到 “不应该” 的 “路由 action” 上
         **/
        route.action = action;
        //标记一下 action 在 url 中
        route.actionInUrl = true;
        return route;
    } else {
        return null;
    }
};

module.exports = Router;

/*end*/