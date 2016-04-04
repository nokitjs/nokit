var utils = module.require("./utils");

/**
 * 定义正则表达式常量
 */
var PLACE_HOLDER_EXPR = /\{.+?\}/gim;
var COLLECT_EXPR_STR = "([^\\/]+)";
var GREEDY_COLLECT_EXPR_STR = "(.+)";

/**
 * 定义路由实例扩展 __proto__
 **/
var routeInstanceProto = {};

/**
 * 生成 action URL
 **/
routeInstanceProto.actionUrl = function(action) {
  var self = this;
  var actionUrl = self.withoutActionUrl + "/" + action;
  actionUrl = actionUrl.replace(/\/\//igm, "/");
  return actionUrl;
};

/**
 * 定义路由对象
 */
function Router(routes, options) {
  var self = this;
  options = options || {};
  self.options = options;
  self.table = [];
  if (routes) {
    self.add(routes);
  }
};

/**
 * 解析占位符 key 定义
 **/
Router.prototype._parseKeyDef = function(_keyDefStr) {
  var keyDefStr = _keyDefStr.substring(1, _keyDefStr.length - 1);
  var keyDefParts = keyDefStr.split(':');
  var keyDef = {};
  keyDef.name = keyDefParts[0];
  if (keyDef.name[0] == "*") {
    keyDef.greedy = true;
    keyDef.name = keyDef.name.substring(1);
  }
  if (keyDefParts[1]) {
    keyDef.expr = new RegExp(keyDefParts[1], 'igm');
  }
  return keyDef;
};

/**
 * 添加一个路由配置
 */
Router.prototype.addOne = function(route) {
  var self = this;
  if (!route || !route.pattern) return;
  //取到所有路由key
  PLACE_HOLDER_EXPR.lastIndex = 0;
  var keyDefs = route.pattern.match(PLACE_HOLDER_EXPR) || [];
  route.keys = {};
  //初始化 url 匹配测试表达式字符串
  var exprStr = '^' + route.pattern + '$';
  utils.each(keyDefs, function(i) {
    //处理 key 定义
    var keyDef = self._parseKeyDef(keyDefs[i]);
    route.keys[keyDef.name] = {
      index: i,
      expr: keyDef.expr
    };
    //将 "key 占位符" 的表达式，替换为 "提交值的正则表达式"
    var collectExprStr = keyDef.greedy ? GREEDY_COLLECT_EXPR_STR : COLLECT_EXPR_STR;
    exprStr = exprStr.replace(keyDefs[i], collectExprStr);
  });
  //生成 url 匹配测试表达式
  route.expr = new RegExp(exprStr, 'igm');
  //处理所有 route 的 method 
  route.methods = route.methods || self.options.defaultMethods;
  if (route.methods && route.methods.length > 0) {
    route.methods = route.methods.map(function(method) {
      return method.toUpperCase();
    });
  }
  //继承原型
  route.__proto__ = routeInstanceProto;
  self.table.push(route);
};

/**
 * 添加路由配置表
 * @param {Route} route 一个路由实体,格式:{pattern:'',target:object}
 * @method addRoute
 * @static
 */
Router.prototype.add = function(routes, srcModule) {
  var self = this;
  utils.each(routes, function(_name, _route) {
    //判断是字符串还是一个对象，并都将 _route 转为对象
    var route = utils.isString(_route) ? { "target": _route } : _route;
    //尝试从名称中解析出 method 和 pattern
    var name = (_name || "/").toString();
    var nameParts = name.split(' ');
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
Router.prototype._parseDynamicAction = function(route) {
  if (route &&
    route.action &&
    route.action.indexOf('{') > -1) {
    utils.each(route.params, function(key, val) {
      route.action = utils.replace(route.action, "{" + key + "}", val);
    });
  }
  return route;
};

/**
 * 创建一个路由实例
 **/
Router.prototype._createRouteInstance = function(srcRoute, url, params) {
  var self = this;
  var routeInstance = { __proto__: srcRoute };
  routeInstance.params = params;
  if (routeInstance.action) {
    var urlParts = url.split('/');
    routeInstance.withoutActionUrl = urlParts.slice(0, urlParts.length - 1);
  }
  else {
    routeInstance.withoutActionUrl = url;
  }
  routeInstance = self._parseDynamicAction(routeInstance);
  return routeInstance;
};

/**
 * 通过请求路径获取第一个匹配的路由
 * @param  {String} url 请求路径
 * @return {Route}           路由实体
 * @method get
 * @static
 */
Router.prototype.get = function(url, handleActionFromUrl) {
  var self = this;
  var routeArray = [];
  if (utils.isNull(url)) {
    return routeArray;
  }
  url = url.replace(/\/\//igm, "/");
  utils.each(self.table, function(i, route) {
    route.expr.lastIndex = 0;
    if (!route.expr.test(url)) return;
    //通过子表达式 "正则的()" 取值
    route.expr.lastIndex = 0;
    var values = route.expr.exec(url);
    //生成 params
    var params = {};
    var failed = utils.each(route.keys, function(key, keyDef) {
      params[key] = values[keyDef.index + 1];
      if (!keyDef.expr) return;
      keyDef.expr.lastIndex = 0;
      if (!keyDef.expr.test(params[key])) {
        return true;
      }
    });
    if (failed) return;
    routeArray.push(self._createRouteInstance(route, url, params));
  });
  //确定 parseActionFromUrl 的值
  handleActionFromUrl = utils.isNull(handleActionFromUrl) ?
    self.options.parseActionFromUrl : handleActionFromUrl;
  //如果需要 parseActionFromUrl
  if (handleActionFromUrl) {
    var _routeArray = self._getForActionFromUrl(url);
    routeArray.push.apply(routeArray, _routeArray);
  }
  return routeArray;
};

/**
 * 从 url 中分解出来 action ，然后获取 route array
 **/
Router.prototype._getForActionFromUrl = function(url) {
  var self = this;
  /*
  一是在如果直接匹配不成功时，才将 “/” 分隔的最后一个 “字串” 当作 action 进行再一次匹配
  */
  var urlParts = url.split('/');
  var lastIndex = urlParts.length - 1;
  var action = urlParts[lastIndex];
  //检查分解出来的 action 是否合法
  if (action === "" || action.indexOf('.') > -1) {
    return null;
  }
  var ctrlRouteUrl = urlParts.slice(0, lastIndex).join('/');
  if (ctrlRouteUrl === '') ctrlRouteUrl = "/"
  var ctrlRouteArray = self.get(ctrlRouteUrl, false) || [];
  var routeArray = ctrlRouteArray.filter(function(route) {
    /**
     * 从 URL 分解出来的 action 不可能是动态的 action
     * route.action 没有指定时才能作为 parseAction 的合法 route
     **/
    if (route.action) return false;
    //设定 action 作为指向 action 的 route
    route.action = action;
    //标记一下 action 在 url 中
    route.actionFromUrl = true;
    return true;
  });
  return routeArray;
};

/**
 * 过滤出包含指定 method 的 route
 **/
Router.prototype.matchByMethod = function(routeArray, method) {
  if (!routeArray || routeArray.length < 1) {
    return routeArray;
  }
  return routeArray.filter(function(route) {
    if (!route || !route.methods || route.methods.length < 1) {
      return false;
    }
    return route.methods.indexOf(method) > -1;
  })[0];
};

module.exports = Router;

/*end*/