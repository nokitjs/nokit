###Nokit 简介
最简单易用的 nodejs 开发框架，如果您曾经写过 asp / php 等代码，或者您曾经写过 JavaScript 客户端代码，
那么您会非常易于上手，Nokit 不同于常见的 nodejs 框架，Nokit 提供了多种开发模式，包括 MVC / NSP / RESTful Service ，开发人员
也可以方便扩展新的模式。

###安装 nokit
nokit 依赖 nodejs，所以需先安装 nodejs，具体请参考 nodejs 网站
> [https://nodejs.org/](https://nodejs.org/)

#####安装 nokit
```javascript
npm install -g nokit-runtime
```

#####更新 nokit
```javascript
npm update -g nokit-runtime
```

###运行 nokit 应用
nokit 应用只需在磁盘建立应用目录，并新建 web.json 配置文件，以及其它相关目录即可，为了更方便 nokit 提供了命令行工具。

#####创建 nokit 应用
```javascript
nokit create <应用名称> [目标目录(默认为当前目录)] [类型(默认为nsp)]
```
以上命令会生成一个最简单的应用所需要的目录结构和配置。

#####运行 nokit 应用
```javascript
nokit <应用根目录> [端口(也可在web.json中指定或省略)]
```

#####代码方式运行 nokit 应用
```javascript
var nokit = require("nokit-runtime");
var server = new nokit.Server({
    root : "应用根目录",
    path : 8000
});
server.start();
```

看到启动提示后，浏览器访问 "http://localhost:8000" (端口请换成具体应用的正确的端口)，
如简单的示例 [http://www.xhou.net:8000](http://www.xhou.net:8000)
