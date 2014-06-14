// 应用程序管理

var Server = require('./server');
var Route = require('./route');
var tp = require('./tp');

var rs = tp.parse("<%= this %>", "houfeng");
console.log(rs);