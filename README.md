##Nokit 简介
最简单易用的 nodejs 开发框架，如果您曾经写过 asp / php 等代码，或者您曾经写过 JavaScript 客户端代码，
那么您会非常易于上手，Nokit 不同于常见的 nodejs 框架，Nokit 提供了多种开发模式，包括 MVC / NSP / RESTful Service ，
开发人员也可以方便的扩展新模式。
Nokit 开发交流 QQ 群: 240603160

##安装和更新
nokit 依赖 nodejs，所以需先安装 nodejs，具体请参考 nodejs 网站
> [https://nodejs.org/](https://nodejs.org/)

####安装 nokit
```javascript
npm install -g nokit-runtime
```

####更新 nokit
```javascript
npm update -g nokit-runtime
```

##命令行工具
nokit 应用只需在磁盘建立应用目录，并新建 web.json 配置文件，以及其它相关目录即可， nokit 提供了方便的命令行工具。

####查看版本
```javascript
nokit 或 nokit ?
```

####创建应用
```javascript
nokit create <应用名称> [目标目录(默认为当前目录)] [类型(默认为nsp)]
```
以上命令会生成一个最简单的应用所需要的目录结构和配置。

####运行应用
```javascript
nokit <应用根目录> [端口(也可在web.json中指定或省略)]
```

##代码引用
除了使用命令行工具，也可以在代码中引用 nokit 的方式来运行 nokit 应用
```javascript
var nokit = require("nokit-runtime");
var server = new nokit.Server({
    root : "应用根目录",
    port : 8000
});
server.start();
```

无论任种方式，启动成功后，即可浏览器访问 "http://localhost:8000" (端口请换成具体应用的正确的端口)，
如简单的示例 [http://www.xhou.net:8000](http://www.xhou.net:8000)

##NSP
NSP 全称为 Nokit Server Pages 也可以理解为 Node Server Pages，是一种类似 asp / php 的 Web 应用开发模式，
NSP 支持 include 引用其它页面，也支持 master 母板页技术。

一般目录结构
```javascript
根目录
│ web.json
├─layout
│     date.nsp
│     master.nsp
├─model
└─public
    │  index.nsp
    │  index.nsp.js
    └─style
         common.css
```

NSP 页面 (*.nsp) 基本介绍
```html
<!-- 输出内容 -->
<p> <%= "输出内容" %> </p>
<!-- this 指向页面处理器，无处理器页面指向默认处理器对象 -->
<p> <%= this.context.request.formData("name") %> </p>

<!-- 循环 -->
<ul> 
<% $.each(this.list,function(i,item){ %>
    <li><%= item.name %></li>
<% }) %>
</ul>

<!-- 分支 -->
<% if(this.type=='a'){ %>
<span>a</span>
<% }else{ %>
<span>b</span>
<% } %>

<!-- 包含 -->
<% $.include("../layout/head.nsp") %>

<!-- 母板页 -->
<html>
...
<div> <% $.placeHolder("content1") %> </div>
...
<div> <% $.placeHolder("content2") %> </div>
...
</html>

<!-- 内容页 -->
<% $.master("./master.nsp") %>

<% $.placeBegin("content1") %>
<span>content1</span>
<% $.placeEnd() %>

<% $.placeBegin("content2") %>
<span>content2</span>
<% $.placeEnd() %>
```

NSP 页面处理器 (*.nsp.js) 基本介绍
```javascript
//定义页面处理器类型
var Index = module.exports = function() {};

//初始化方法，每次回发都将触发 init 方法
Index.prototype.init = function(context) {
    var self = this;
    /*
    self.server //当前 server 实例
    self.context //当前请上下文对象
    self.request //同 context.request，请求对象
    self.response //同 context.response 响应对象
    //由于 nokit 为异步处理，调用 render() 方法向浏览器呈现页面.
    //不要在 init 方法调用。
    self.render() 
    */
    self.name = 'Nokit NSP';
};

//默认方法，首次打开页面，会触发 load 方法
Index.prototype.load = function(context) {
    var self = this;
    self.render();
};

//事件方法，可以绑定到页面中的 html 控件
Index.prototype.add = function(context) {
    var self = this;
    var val = parseInt(self.numBox.val());
    self.numBox.val(++val);
    self.numBox.css("border","solid 1px red");
    self.render();
};
```

页面绑定
```html
<!-- 绑定到处理器方法 -->
<input type="button" onclick="nsp.call('add')" value='add' />
```

共享元素，通过 "nsp-id" 声明为，客户端和服务端的共享元素，便可以在客户端和服务端同时操作指定元素，
并能在回发时保持状态，类似 Asp.NET 的 WebForms，但理念、原理又非常不同，NSP 共享元素非常轻量，更简洁易用。
```html
<!-- 此元素可以在服务端和客户端同时访问 -->
<input type="text" value="hello" nsp-id='test' />
```
```javascript
Index.prototype.add = function(context) {
    var self = this;
    //服务端提供类 jQuery 的元素操作 API (兼容部分常用 jQUery API)
    self.test.val('你好'); 
    self.render();
};
```


##MVC
Nokit MVC 是一种设计简约、符合 MVC 模式 Web 应用开发模式。

一般目录结构

```javascript
根目录
│ web.json
├─controllers
│    home.js
├─models
├─public
│  └─style
│       common.css
└─views
     date.html
     home.html
     master.html
```
views 目录存放的是视图，视图和 NSP 的页面相似，支持 include 和 master，语法也完全相同，
不同是在 mvc 的视图中 this 指向的是模型，视图具有单一的责职 ，就是呈现模型中的数据。
controllers 是控制器目录，单个文件为一个控制器，用来响应接受来自用户的请求，并传递给模型，
然后，完成模型和视图的装配。
models 为模型目录，nokit 对模型没有统一的要求和控制，应用的业务逻辑应在模型中完成。

MVC 的控制器示例
```javascript
//定义控制器类型
var Home = module.exports = function() {};

/*
默认 action ，
通常用户直接请求某一 url 会被路由到，指定 controller 的默认 action
*/
Home.prototype.index = function() {
    var self = this;
    
    /*
    self.context 可以访问当前请求上下文对象
    self.context.routeData["name"] 可以获取路由数据
    self.context.queryData['name'] 可以获取 queryString 对应数据
    self.context.formData['name'] 可以获取 post 数据
    self.context.data("name") 可以获取客户端传过来的 queryString 或 formData
    */
    
    //通过 self.render 方法呈现指定的视图，并进行模型绑定
    self.render("home.html", {
        "name": "Nokit MVC"
    });
};
```

MVC 的 web.json 配置
```javascript
{
    /*
    配置 handler ，将指定的请求交由 MVC Handler 处理，支持正则表达式，
    如示例，将应用的所有请求都交由 MVC 处理，
    在找不到匹配的路由配置时，会转由 Static Handler 处理
    */
    "handlers": {
        "^/": "$./handlers/mvc"
    },
    "mvc": {
        /*
        配置 MVC 相关代码文件的存放目录，指定 controller 和 view 的目录位置，
        model 不用配置。
        */
        "paths": {
            "controller": "./controllers",
            "view": "./views"
        },
        /*
        每一个路由至少需要指定 pattern(URL匹配模式) 和 target(目标contrller)
        还可以通过配置 action 项指定对应的 action (controller方法)。
        pattern 格式示例 "/user/{userId}" 其中 userId 是占位符变量，
        可以在 controller 中通过 context.routeData['userId'] 获取。
        */
        "routes": [{
            "pattern": "/home",
            "target": "./home.js"
        },{
            "pattern": "/",
            "target": "./home.js"
        }]
    }
}
```



##RESTful
Nokit 用来开发 RESTful Server 是非常方便和简单的，通过简洁的 URL 路由配置，抽象出和资源对应的请求处理程序文件即可，
可以在处理程序中，根据需求实现 get / post / put 等 http Method 即可。

一般目录结构
```javascript
根目录
│ web.json
├─public
│  │  index.nsp
│  └─style
│       common.css
└─restful
      user.js
```

REST 的资源控制器示例
```javascript
//定义资源控制器类型，通常一个资源类型视为一个控制器
function User() {};

//针对 User 的 post HttpMethod 处理方法
User.prototype.post = function() {
    var self = this;
        
    /*
    self.context 可以访问当前请求上下文对象
    self.context.routeData["name"] 可以获取路由数据
    self.context.queryData['name'] 可以获取 queryString 对应数据
    self.context.formData['name'] 可以获取 post 数据
    self.context.data("name") 可以获取客户端传过来的 queryString 或 formData
    */
    
    var routeData = self.context.routeData;
    self.out("routeData:" + routeData["userId"]);
};

//针对 User 的 get HttpMethod 处理方法
User.prototype.get = function() {
    var self = this;
    self.out("routeData:" + routeData["userId"]);
};

/*
根据需求实现对应的 httpMethod 处理方法即可
*/

module.exports = User;
```

REST 的 web.json 配置
```javascript
{
    /*
    配置 handler ，将指定的请求交由 REST Handler 处理，支持正则表达式，
    如示例，/api/... 开头的请求，交由 REST Handler 处理
    */
    "handlers": {
        "^/api/": "$./handlers/restful"
    },
    "restful": {
        "path": "./restful", //指定资源控制器的存放目录
        /*
        每一个路由至少需要指定 pattern(URL匹配模式) 和 target(目标contrller)
        pattern 格式示例 "/user/{userId}" 其中 userId 是占位符变量，
        REST 的路由配置没有 action 配置项。
        */
        "routes": [{
            "pattern": "/api/user/{userId}",
            "target": "./user.js"
        }]
    }
}
```



