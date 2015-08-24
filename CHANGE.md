### 1.10.2
1. 微调错误页样式

### 1.10.1
1. 优化 static handler 缓存处理

### 1.10.0
1. 修复 filter 在 onResponse、onRequestEnd 时的一个 Bug

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