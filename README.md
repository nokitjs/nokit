##Nokit 简介
最简单易用的 nodejs 开发框架，如果您曾经写过 asp / php 等代码，或者您曾经写过 JavaScript 客户端代码，
那么您会非常易于上手，Nokit 不同于常见的 nodejs 框架，Nokit 提供了多种开发模式，包括 MVC / NSP / RESTful Service ，
开发人员也可以方便的扩展新模式。

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



