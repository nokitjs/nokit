# 简介
Nokit 是一个简单易用的基于 Nodejs 的 Web 开发框架，默认提供了 MVC / NSP / REST 等支持，并提供对应项目模板。
Nokit 核心非常简洁，大多数功能以扩展形式存在，开发人员也可以方便的为 Nokit 添加新的扩展。

[![npm version](https://badge.fury.io/js/nokitjs.svg)](http://badge.fury.io/js/nokitjs)
[![Build Status](https://travis-ci.org/nokitjs/nokit.svg?branch=master)](https://travis-ci.org/nokitjs/nokit) 

# 安装

```sh
$ npm install nokitjs [-g]
```

# 示例

#### 创建应用
```sh
$ nokit create demo 
```
以上命令会生成一个最简单的应用所需要的目录结构和配置。

#### 启动应用
```sh
$ nokit start -n demo
```

#### 查看应用
```javascript
[sudo] nokit list
```
查看所有已启动的应用

#### 停止应用
```javascript
[sudo] nokit stop name
```
可以指定 pid (进程ID，可以用过 nokit list 查看)，停止指定的的应用，也可以省略停止所有应用

#### 重启应用
```javascript
[sudo] nokit restart name
```
可以指定 pid (进程ID，可以用过 nokit list 查看)，重启指定的的应用，也可以省略重启所有应用


# 社区
1. 说明文档 [wiki](https://github.com/nokitjs/nokit/wiki)
2. 问题反馈 [issues](https://github.com/nokitjs/nokit/issues)
4. 交流论坛 [http://jser.cc](http://jser.cc) 
