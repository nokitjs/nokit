## 简介
Nokit 是一个简单易用的基于 Nodejs 的 Web 开发框架，默认提供了 MVC / NSP / REST 等支持，并提供对应项目模板。
Nokit 核心非常简洁，大多数功能以扩展形式存在，开发人员也可以方便的为 Nokit 添加新的扩展。

[![npm version](https://badge.fury.io/js/nokitjs.svg)](http://badge.fury.io/js/nokitjs)
[![Build Status](https://travis-ci.org/nokitjs/nokit.svg?branch=master)](https://travis-ci.org/nokitjs/nokit) 

## 社区
1. 说明文档 [wiki](https://github.com/nokitjs/nokit/wiki)
2. 问题反馈 [issues](https://github.com/nokitjs/nokit/issues)
4. 交流论坛 [http://jser.cc](http://jser.cc) 

## 安装和更新

#### 安装 nokit
```javascript
[sudo] npm install nokitjs [-g]
```

#### 更新 nokit
```javascript
[sudo] npm update nokitjs [-g]
```

## 命令行工具
使用 “命令行工具” 时必须全局安装 nokitjs (全局安装的同时也可以在 app 中本地安装 nokitjs)
Nokit 应用只需在磁盘建立应用目录，并新建相关文件和目录即可， Nokit 提供了方便的命令行工具。
命令行工具还提供进程管理相关功能，确保应用能够持续稳定的运行，并能在遇到故障时快速自动恢复。

#### 查看版本
```javascript
[sudo] nokit [?]
```

#### 创建应用
```javascript
[sudo] nokit create [name] [mvc|nsp|rest] [folder] 
```
以上命令会生成一个最简单的应用所需要的目录结构和配置。

1. name 一般不建议省略（省略时为 nokit-app），name 将会作为应用的根目录名称
2. type 默认为 mvc 也可以指定为 nsp 或 rest ，指定类型后将会创建对应的应用模板
3. folder 为目标目录，省略时将默认为当前所在目录。
 

#### 运行应用
```javascript
[sudo] nokit start [port] [root] [-env:<name>] [-cluster[:num]] [-watch[:.ext,...]] [node-opts]
```
1. -env 指定运行配置名称，将会根据 "配置名称" 加载 app.xxx.json (xxx 为指定的配置名称) 作为应用配置文件。
2. -cluster 选项可以开启 "单机集群模式"，使应用有效的利用多核 CPU，也使应用更加健壮可靠，-cluster 选项可以指定进程数，如 -cluster:4 ，默认为 CPU 核数。
3. -watch 选项开启后，在应用文件发生改变时会自动完成进程重启，默认任何文件变更都将触发重启，也可以指定文件类型，如 -watch:.js,.html,.css
4. -public 一般用于为 html/js/css 等静态资源启动一个临时 WebServer，指定静态资源目录，静态资源目录为 root 的相对目录。
5. --debug 为 nodejs 选项，可以开启 debug 模式，开启后可以使用 nodejs 内置调试工具调式，也可以使用 node-inspector 等工具进行调试。

#### 停止应用
```javascript
[sudo] nokit stop [pid|all]
```
可以指定 pid (进程ID，可以用过 nokit list 查看)，停止指定的的应用，也可以省略停止所有应用

#### 重启应用
```javascript
[sudo] nokit restart [pid|all]
```
可以指定 pid (进程ID，可以用过 nokit list 查看)，重启指定的的应用，也可以省略重启所有应用

#### 查看运行中的应用
```javascript
[sudo] nokit list
```
查看所有已启动的应用

#### 开机自启动
```javascript
[sudo] nokit autostart [on|off] [-uid:[domain\]user [-pwd:password]] 
```
autostart 命令目前支持 win32 和 linux 平台，此命令需要管理员权限，如 ubuntu 需要使用 sodu ，
在 windows 平台会弹出 "用户账户控制" 提示框。
-uid 和 -pwd 参数仅在 win32 平台有效，其它平台将被忽略，在不指定 -uid 、-pwd 参数时，需有用户登录到 windows 
才会自动启动 Nokit App，当指定 -uid、-pwd 时，只要启动 windows 就会自动启动 Nokit App。
无论是登录 windows 的账户或是通过 -uid 提定的账户，需要是安装 nodejs 和 npm 时所用的账户。

## 代码引用
除了使用命令行工具，也可以在代码中引用 nokit 的方式来运行 nokit 应用，
在代码中引用 nokit，将不能利用 nokit 的进程管理功能，这时可以直接运行，或者使用 pm2 / forever 等工具进行管理。
```javascript
var nokit = require("nokitjs");
var server = new nokit.Server({
    root : "应用根目录",
    port : 8000
});
server.start();
```

无论任种方式，启动成功后，即可浏览器访问 "http://localhost:8000" (端口请换成具体应用的正确的端口)，
如简单的示例 [http://jser.cc](http://jser.cc)

## NSP
NSP 全称为 Nokit Server Pages 是一种类似 asp / php 的 Web 应用开发模式，
NSP 支持 include 引用其它页面，也支持 master 母板页技术。

一般目录结构
```javascript
根目录
│ app.js
│ config.json
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
<p> <%= this.context.form("name") %> </p>

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
var IndexPresenter = module.exports = function() {};

//初始化方法，每次回发都将触发 init 方法
IndexPresenter.prototype.init = function() {
    var self = this;
    /*
    self.server //当前 server 实例
    self.context //当前请上下文对象
    self.request //同 context.request，请求对象
    self.response //同 context.response 响应对象
    self.context.query['name'] 可以获取 query 对应数据
    self.context.form['name'] 可以获取 post 数据
    self.context.param("name") 可以获取客户端传过来的 query 或 form
    self.context.cookie 访问 cookie
    se轩.context.session 访问 session 数据
    */
    self.name = 'Nokit NSP';
    //init（初始化）完成后，需要调用 ready 方法，通知初始化完成
    self.ready();
};

//默认方法，首次打开页面，会触发 load 方法
IndexPresenter.prototype.load = function() {
    var self = this;
    //由于 nokit 为异步处理，调用 self.render() 方法向浏览器呈现页面.
    //不要在 init 方法调用 self.render() 
    self.render();
};

//事件方法，可以绑定到页面中的 html 控件
IndexPresenter.prototype.add = function() {
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

共享元素，将普通 DOM 元素通过 "nsp-id" 声明为客户端和服务端的共享元素，便可以在客户端和服务端同时操作指定元素，
并能在回发时保持状态，类似 Asp.NET 的 WebForms，但理念、原理又非常不同，NSP 共享元素非常轻量，更简洁易用。
```html
<!-- 此元素可以在服务端和客户端同时访问 -->
<input type="text" value="hello" nsp-id='test' />
```
```javascript
IndexPresenter.prototype.add = function() {
    var self = this;
    //服务端提供类 jQuery 的元素操作 API (兼容部分常用 jQUery API)
    self.test.val('你好'); 
    self.render();
};
```    

## MVC
Nokit MVC 是一种设计简约、稳定、高效的 Web 应用开发模式。

一般目录结构

```javascript
根目录
│ app.js
│ config.json
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
不同的是在 mvc 的视图中 this 指向的是模型，视图具有单一的责职 ，就是呈现模型中的数据。
controllers 是控制器目录，单个文件为一个控制器，用来响应接受来自用户的请求，并传递给模型，
然后，完成模型和视图的装配。
models 为模型目录，nokit 对模型没有统一的要求和控制，应用的业务逻辑应在模型中完成。

MVC 的控制器示例
```javascript
//定义控制器类型
var HomeController = module.exports = function() {};

/*
默认 action ，
通常用户直接请求某一 url 会被路由到指定 controller 的默认 action
*/
HomeController.prototype.index = function() {
    var self = this;
    
    /*
    self.context 可以访问当前请求上下文对象
    self.context.params["name"] 可以获取路由数据
    self.context.query['name'] 可以获取 queryString 对应数据
    self.context.form['name'] 可以获取 post 数据
    self.context.param("name") 可以获取客户端传过来的 query 或 form
    self.context.cookie 访问 cookie
    se轩.context.session 访问 session 数据
    */
    
    //通过 self.render 方法呈现指定的视图，并进行模型绑定
    self.render("home.html", {
        "name": "Nokit MVC"
    });
};
```

MVC 的 config.json 配置
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
        可以在 controller 中通过 context.params['userId'] 获取。
        */
        "routes": {
            "/home": "./home"
            "/": "./home"
        }
    }
}
```



## REST
Nokit 用来开发 RESTful Service 是非常方便和简单的，通过简洁的 URL 路由配置，抽象出和资源对应的请求处理程序文件即可，
可以在处理程序中，根据需求实现 get / post / put 等 HttpMethod 即可。同时，也可以用 Nokit MVC 来开发 RESTful Service。

一般目录结构
```javascript
根目录
│ app.js
│ config.json
├─public
│  │  index.nsp
│  └─style
│       common.css
└─api
      user.js
```

REST 的资源控制器示例
```javascript
//定义资源控制器类型，通常一个资源类型视为一个控制器
function UserController() {};

//针对 User 的 post HttpMethod 处理方法
UserController.prototype.post = function() {
    var self = this;
        
    /*
    self.context 可以访问当前请求上下文对象
    self.context.params["name"] 可以获取路由数据
    self.context.query['name'] 可以获取 query 对应数据
    self.context.form['name'] 可以获取 post 数据
    self.context.param("name") 可以获取客户端传过来的 query 或 form
    */
    
    var routeParams = self.context.params;
    self.out("routeParams:" + routeParams["userId"]);
};

//针对 User 的 get HttpMethod 处理方法
UserController.prototype.get = function() {
    var self = this;
    self.out("routeParams:" + routeParams["userId"]);
};

/*
根据需求实现对应的 httpMethod 处理方法即可
*/

module.exports = UserController;
```

REST 的 config.json 配置
```javascript
{
    /*
    配置 handler ，将指定的请求交由 REST Handler 处理，支持正则表达式，
    如示例，/api/... 开头的请求，交由 REST Handler 处理
    */
    "handlers": {
        "^/api/": "$./handlers/rest"
    },
    "rest": {
        "path": "./rest", //指定资源控制器的存放目录
        /*
        每一个路由至少需要指定 pattern(URL匹配模式) 和 target(目标contrller)
        pattern 格式示例 "/user/{userId}" 其中 userId 是占位符变量，
        REST 的路由配置没有 action 配置项。
        */
        "routes": {
            "/api/user/{userId}": "./user"
        }
    }
}
```
