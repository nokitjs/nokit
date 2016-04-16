### 1.23.2
1. 改进 CLI

### 1.23.0
1. 修复浏览器中的旧 cookie 会被重写设置的 Bug
2. 修复 CLI 重启一单个应用时的 CLI 进程不退出问题 
3. 修复 controller.init 为 generator 时异常处理 Bug
4. 修复「路由参数限定」表达式检查 Bug

### 1.22.6
1. 增加 context.promise 方法
2. 增加 context.thunk 方法
3. 改进使用 generator 时的错误处理
4. 更新 examples

### 1.22.4
1. 重写 Task 模块
2. 增加 nokit.define 方法
4. 分拆 Base64 模块

### 1.22.1
1. 改进路由处理
2. 更新 Buffer 拼接方式
3. 改进静态资源处理
4. 支持通过 generator/yield 控制异步流程

### 1.21.2
1. 新增路由参数验证表达式功能
2. 改进路由处理($.route.actionUrl 方法)
3. 更新 filter 、handler 别名格式

### 1.21.0
1. 重构 Router
2. 重构 Context
3. 重构 Response
4. 重构 Request
5. 重构 Cookie
6. 重构 Session
7. 重构 Logger
8. 新增 context.buffer
9. 新增 context.data/context.param

### 1.20.2
1. 改进 "host" 配置
2. 改进 "forbiddens" 配置
3. 改进 "默认文档" 配置
4. 改进 "cache" 配置
5. 改进 "压缩" 配置

### 1.20.1
1. 改进目录浏览功能
2. "URL 格式错误" 日志级别调整为 warn

### 1.20.0
1. 使 NSP 也能使用路由配置
2. 使 NSH 也能使用路由配置
3. 补充 test cases

### 1.19.9
1. 更新 cli 参数处理
2. 补充 test case
3. 更新依赖
4. 增强 “静态目录” 配置功能

### 1.19.6
1. 重构 cli 代码
2. 资源、响应页、cli 等调整为英文
3. 更新目录浏览页结构及样式
4. 修复 cli ```-public``` 指定子目录时的错误
6. 支持自定义配置文件名

### 1.19.2
1. 改进 console 对对象及异常的打印效果
2. 修复一个直接用 node 启动时发生异常 console 不显示信息的 Bug
3. 改进异常处理

### 1.19.0
1. 优化请求上下文件 (context)
2. context.send 支持 json 数据
3. 改进 server, 增加进程退出日志
4. 修复一个 http2https 导致的日志记录 Bug
5. 简化日志逻辑
6. 优化进程遇到异常时的退出处理
7. 修复一个 Content-Encoding 的 Bug
8. 处理一个 decodeURI 引起的异常

### 1.18.4
1. 允许作为 express 中间件使用
2. 添加 test case
3. 增加针对 Server 实例的扩展插件机制
4. filter 、handler 支持设置 verbs
5. 修复 res.end 不为空时的一个 Bug
6. 更改 nokit 运行信息存储目录

### 1.17.6
1. 修复 DATA_PATH 没有权限时的异常
2. 添加单元测试及部分 test case
3. 修复 contxt.text 为数字时的 Bug
4. 优化进程异常处理

### 1.17.4
1. 修复 1.17.2 引入的一个 http to https 跳转 Bug
2. 处理异常处理，增加对 onRequest 异常的捕获
3. 更新上游依赖

### 1.17.2
1. cookie.add 调整为 cookie.set
2. 优化压缩处理，允许统一禁用或启用压缩，增加 mime 判断
3. 优化缓存处理，允许统一禁用或启用缓存，增加 mime 判断
4. 优化异常处理，发生未处理异常后且进程结束前，不再 KeepAlive
5. restful Handler 及相关配置，重命名为 rest

### 1.16.9
1. 修复 filter 事件有可能发生无法 end 请求的问题
2. create 命令，增加已存在目录检查
3. 重构 context 对象，1) content 方法改为 send/write 方法; 2)data 改为 params 
4. context 对象增加 file、text 方法
5. 修复 server.resovlePath 在参数为 null 时的异常
6. 复复禁用 log 时的异常
 
### 1.16.4
1. 新增路由直接指向 view 
2. 重构路由配置格式，改进路由查找
3. 更新 examples/xxx/app.js
4. 视图模板语法 placeHolder、palceBegin、placeEnd 增加别名
5. 改进 server.start、server.stop 方法

### 1.16.1
1. 更新系统配置 (system.json)
2. MVC 的 controller 增加 response、request、server、session 属性
3. NSP 的 presenter 增加 server、session 属性

### 1.16.0
1. 改进路由处理
2. 改进配置合并
3. 改进 mvc 处理
4. 改进 task 模块

### 1.15.6
1. 重构路由模块
2. 重构视图引擎模块
3. 增加 context.json 方法
4. 增加 context.jsonp 方法
5. 增加 $.route (在模板中使用)
6. 增加本地化支持

### 1.15.4
1. app.json 重命名为 config.js，app.xxx.json 重命名为 config.xxx.json
2. 配置文件支持 .js 文件，比如 config.js、config.xxx.js

### 1.15.3
1. 更新应用示例模板的 package.json (声明对 nokitjs 的依赖)
2. 优化 "路由配置"，除了 Array 方式，新增支持 map 方式

### 1.15.0
1. 优化 Session 处理
2. 优化日志处理
3. 修复 CLI 的 -public 参数 bug

### 1.14.7
1. 增加 301 重定向方法 context.permanentRedirect（低于 1.4.7 也可用 context.status 方法处理）
2. 优化异常处理
3. 更新进程列表信息，移除 cluster 列（可通过 wpid 列表判断）；增加 env 列

### 1.14.6
1. 优化提示信息
2. 修正 start 命令省略端口时配置优先级问题

### 1.14.4
1. 完善对 https 支持
2. 开启 https 时，增加 http to https 跳转支持
3. 更新 CLI 提示信息
4. 更新依赖

### 1.14.0
1. 添加 https 支持

### 1.13.9
1. 调整 500 错误页显示

### 1.13.8
1. 兼容 4.0 以下版本（测试过 0.10.29+）
2. 调整一些 HTTP 状态页显示
3. 优化异常处理

### 1.13.6
1. NSP 保持汉字不被 decode
2. 支持配置多个 public 目录
3. 优化 cluster 模式进程错误处理

### 1.13.5
1. 增加根据 NODE_ENV 加载配置文件的功能
2. 应用配置文件更名为 app.json
3. debugMode 变更为 showErrorDetail
4. nokit start 中 -config 变更为 -env

### 1.13.0
1. 更新运行配置存储路径

### 1.12.9
1. 重构 logger 和 "异常处理"
2. ready 函数(存在于 nsp/mvc/rest) 增加防重复调用
3. context 相关输入函数增加防重复调用

### 1.12.6
1. 重构 logger 和 seession 模块
2. 更新依赖

### 1.12.1
1. 重构 Filter 和 Handler 格式及配置
2. 增加并行 Filter 支持
3. 改进 Session API
4. 更新上游依赖

### 1.11.9
1. 重构 session ，调整方法名
2. 重构 Logger ，调整日志格式
3. 重构 env.DATA_PATH 处理
4. 更新依赖

### 1.11.7
1. MVC 增加 onMvcHandle 过滤器回调
2. MVC 的 init 方法改为异步
3. NSP 增加 onNspHandle 过滤器回调
4. NSP 的 init 方法改为异步
5. REST 增加 onRestHandle 过滤器回调
6. REST 增加异步 init 方法
7. 合并 css 和 less 处理器扩展

### 1.11.6
1. 更新上游依赖

### 1.11.5
1. 优化 mvc、rest 的路由匹配，使 “查询字符串” 不再参与匹配
2. 优化 context 的 URL 处理、跳转、重定向

### 1.11.4
1. 优化 routeing 匹配，使 “查询字符串” 不再参与匹配

### 1.11.3
1. 优化 ViewEngine 使其允许传入的 model 为 null
2. mvc 模板增加 $.controller 
3. nsp 模板增加 $.self ($.self 与 this 相等)

### 1.11.2
1. 优化 context.setUrl 处理
2. 强化 mvc 路由的 action 处理

### 1.11.1
1. 强化 mvc 路由的 action 处理

### 1.11.0
1. 优化不同平台路径处理。

### 1.10.18
1. 修复在 windows 平台 -watch 无法启动的 bug。

### 1.10.17
1. 重构所有地方统一用 env.EOL 确定换行符。
2. 修复在 windows 平台 -watch 无法启动的 bug。

### 1.10.16
1. 重构 env 模块，所有变量统一采用大写加下划线。
2. 重构内置 logger 模块，采用 env.EOL 确定换行符。
3. 修复在 windows 平台 context.setUrl 方法针对 url 的 normalize 错误。

### 1.10.15
1. 修复了在部分 windows 平台，进程管理工具启动应用失败的 bug
2. 调整 README.md 标题格式

### 1.10.13
1. 修复在某些 windows 机器上，命令行工具因为 socket 消息过长导致的 bug

### 1.10.12
1. 修复在某些 windows 机器上找到不 evn.HOME 的 Bug

### 1.10.11
1. 重构 server 的 _transferRequest 方法(重命名+优化逻辑)
2. 将 handler 的 transfer 重命名为 next
3. 优化 context.transfer 方法
4. 优化默认文档处理 (改为异步处理)

### 1.10.10
1. 修复 context 处理 deflate 压缩时的问题
2. Static Handler 浏览目录时进行了排序

### 1.10.9
1. 替换文件监听模块 gaze 为 chokidar

### 1.10.8
1. 重构 Server 类，提供 start、stop 两个事件
2. 替换文件监听模块 watch 为 gaze

### 1.10.7
1. 重构 context.data 方法。

### 1.10.6
1. 更新 sytem.json 中的默认配置。
2. 修正 .json 的 mime 类型，调整 parser 配置
3. 修正 .xml 的 mime 类型，调整 parser 配置，修复解析 Bug
2. 新增 nsh 处理器
3. 优化 nsp 处理，绑定方法支持参数，优化 form 查找机制

### 1.10.5
1. 优化 Session 模块加载。

### 1.10.4
1. 优化日写入。
2. 优化默认 Session 提供程序

### 1.10.3
1. 调整日志格式，优化日写入。
2. 重命名默认配置文件名 (system.json)。

### 1.10.2
1. 微调错误页样式

### 1.10.1
1. 优化 static handler 缓存处理

### 1.10.0
1. 修复 filter 在 onResponse、onRequest 时的一个 Bug

### 1.9.20
1. 紧急修复一个拼写错误导到的 bug

### 1.9.19
1. 优化缓存处理
2. CLI 增加 -cache 参数

### 1.9.18
1. cookie 启用 HttpOnly
2. 优化路径计算
3. 修复 nsp 已知 Bug

### 1.9.17
1. 重构将所有可能影响性能的同步代码改为异步
2. 扩展 context 方法
3. 允许通过 options 指定 app 的 configFile
4. 命行工具增加按指定配置运行选项 -config

### 1.9.15
1. 优化 mime 设置
2. 增加 debug 模式
3. 允许通过 options 指定 app 的 configFile

### 1.9.13
1. 优化 cookie 模块

### 1.9.11
1. 重构 Server 模块
2. 重构 Context 模块
2. 重构所有内置 Parser 模块
3. 重构所有内置 Hanlder 模块

### 1.9.10
1. 更新资源和示例程序中 css 的 “字体”
2. 为示例程序添加 package.json

### 1.9.9
1. 更新缓存默认配置
2. 增加路径计算函数

### 1.9.8
1. 更新缓存默认配置

### 1.9.7
1. 优化缓存处理
2. 优化 http状态 响应逻辑
3. 更新依赖

### 1.9.6
1. 优化公共模板处理逻辑
2. 优化 http状态 响应逻辑
3. 更新 examples 中的 ‘入口程序’

### 1.9.4
1. 增加默认 favicon 
2. 优化压缩处理
3. 增加 mime 配置

### 1.9.3
1. 改进异常处理

### 1.9.2
1. 将 tp、cmdline、utils 作为独立 npm 包引用
2. 静态文件统一用流方式处理
3. 增加 gzip、deflate 支持
4. 默认不做任何服务器端文件缓存
5. 增加 "text\xml" 的 parser
6. 发生异常时输入更详细的信息