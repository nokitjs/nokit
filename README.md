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
nokit 应用只需在磁盘建立应用目录，并新建 web.json 配置文件，以及其它相关目录即可，为了更方便 nokit 提供了命令行工具。

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
    path : 8000
});
server.start();
```

无论任种方式，启动成功后，即可浏览器访问 "http://localhost:8000" (端口请换成具体应用的正确的端口)，
如简单的示例 [http://www.xhou.net:8000](http://www.xhou.net:8000)

##NSP
NSP 全称为 Nokit Server Pages 也可以理解为 Node Server Pages，是一种类似 asp / php 的 Web 应用开发模式，
NSP 支持 include 引用其它页面，也支持 master 母板页持术。

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
<!-- this 指向页面处理器，无处理器页面指向默信处理器对象 -->
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
    self.test.val('你好'); //服务端提供类 jQuery 的元素操作 API (兼容部分常用 jQUery API)
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



