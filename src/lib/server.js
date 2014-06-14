var http = require('http');
var fs = require('fs');
var path = require('path');

//Server类.
var Server = function(path, port) {
    var self = this;
    self.root = path || '';
    self.port = port || 8000;
    var rootLastChar = self.root[self.root.length - 1];
    if (rootLastChar === '/' || rootLastChar === '\\') {
        self.root = self.root.substr(0, self.length - 1);
    }
    self.init();
};

//mime类型表
var mimes = Server.mimes = {
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json':'application/x-javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.ico':'image/x-icon',
    '*':'application/octet-stream'
};

//mime类型表
var status = Server.status = {
    'error': {
        code: 500,
        message: '{0}<hr/>server error'
    },
    'success': {
        code: 200
    },
    'notfound': {
        code: 404,
        message: '{0}<hr/>not found'
    }
};

//处理错误
Server.prototype.error = function(req, res, ex) {
    var self = this;
    res.writeHead(status.error.code, {
        'Content-Type': mimes['.html'],
        'url': req.url
    });
    res.end(status.error.message.replace('{0}', ex.message));
    //console.error(ex.message);
};

//没有找到
Server.prototype.notFound = function(req, res) {
    var self = this;
    res.writeHead(status.notfound.code, {
        'Content-Type': mimes['.html'],
        'url': req.url
    });
    res.end(status.notfound.message.replace('{0}', req.physicalPath));
    //console.error(ex.message);
};

//获取mime
var getMime = Server.getMime = function(url) {
    var extname = path.extname(url);
    //console.log(extname);
    return mimes[extname] || mimes['*'];
};

//输出目录
Server.prototype.writeFolder = function(req,res){
    var self = this;
	fs.readdir(req.physicalPath,function(err,files){
	    var buffer=[];
	    files.forEach(function(item){
	        var itemPath = path.normalize(req.physicalPath+'/'+item);
	        var stats = fs.statSync(itemPath);//临时用同步方式
            if(stats.isDirectory()){
                buffer.push('<li><a href="'+item+'/">'+item+'/</a></li>');
            }else{
                buffer.push('<li><a href="'+item+'">'+item+'</a></li>');
            }
		});
		res.writeHead(status.success.code, {
            'Content-Type': mimes['.html'],
            'url': req.url
        });
        res.end(req.url+'<hr/><ul>'+buffer.join('')+'</ul>');
	});
};

//输出静态文件
Server.prototype.writeFile = function(req, res) {
    var self = this;
    fs.readFile(req.physicalPath,function(err, data) {
        var mime = getMime(req.physicalPath);
        res.writeHead(status.success.code, {
            'Content-Type': mime,
            'url': req.url
        });
        res.end(data);
    });
};

Server.prototype.init = function(){
    var self = this;
    self.server = http.createServer(function(req, res) {
        req.url = path.normalize(req.url||'');
        req.physicalPath = path.normalize(self.root +'/'+ req.url.split('?')[0]);
        try {
            fs.exists(req.physicalPath,function(exists) {
                if (exists) {
                     fs.stat(req.physicalPath,function(err,stats){
                        if(stats.isDirectory()){
                            self.writeFolder(req,res);
                        }else{
                            self.writeFile(req, res);
                        }
                     });
                }else{
                    self.notFound(req,res);
                }
            });
        } catch(ex) {
            self.error(req, res, ex);
        }
    });
};

//启动Server
Server.prototype.start = function(port,callback) {
    var self = this;
    self.port = port || self.port;
    self.server.listen(self.port,callback);
    console.log('Server Start.');
};

//停止Server
Server.prototype.stop = function(callback) {
    var self = this;
    self.server.close(callback);
    console.log('Server Stop.');
};

//导出模块
module.exports = Server;
//