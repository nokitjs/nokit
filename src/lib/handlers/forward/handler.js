var Handler = module.exports = function(server) {
    var self = this;
    self.server = server;
    self.configs = self.server.configs;
};

//处理请求
Handler.prototype.handleRequest = function(req, res) {
    var self = this;
     self.server.responseContent(req, res, req.url);
};

Handler.prototype.parseFwdUrl = function(fwdUrl) {
    var rs = {};
    rs.protocol = fwdUrl.indexOf('https://') - 1 ? 'https://' : 'http://';
    fwdUrl = fwdUrl.replace('https://', '').replace('http://', '');
    var firstSplitIndex = fwdUrl.indexOf('/');
    if (firstSplitIndex > -1) {
        rs.hostAndPort = fwdUrl.substring(0, firstSplitIndex);
        rs.host = rs.hostAndPort.split(':')[0] || '';
        rs.port = rs.hostAndPort.split(':')[1] || 80;
        rs.path = fwdUrl.substring(firstSplitIndex);
    } else {
        rs.hostAndPort = fwdUrl;
        rs.host = rs.hostAndPort.split(':')[0] || '';
        rs.port = rs.hostAndPort.split(':')[1] || 80;
        rs.path = '/';
    }
    return rs;
};

Handler.prototype.forward = function(req, res, fwdInfo) {
    var self = this;
    req.headers.host = fwdInfo.hostAndPort;
    req.headers.origin = fwdInfo.protocol + fwdInfo.hostAndPort;
    req.headers.referer = fwdInfo.protocol + fwdInfo.hostAndPort + fwdInfo.path;
    var postData = querystring.stringify(req.postData);
    req.headers["content-length"] = postData.length;
    //delete req.headers["content-length"];
    var remoteReq = http.request({
        host: fwdInfo.host,
        port: fwdInfo.port,
        path: fwdInfo.path,
        method: req.method,
        headers: req.headers
    }, function(remoteRes) {
        res.writeHead(status.success.code, remoteRes.headers);
        remoteRes.on('data', function(data) {
            res.write(data);
        }).on('end', function() {
            res.end();
        });
    }).on('error', function(ex) {
        Handler.prototype.error(req, res, "Remote Error : " + ex.message);
    });
    remoteReq.write(postData + "\n");
    remoteReq.end();
};

Handler.prototype.forwardUrl = function(req, res, rule) {
    var self = this;
    //
    var remoteUrl = rule.value;
    //以下是接受数据的代码
    var fwdInfo = Handler.prototype.parseFwdUrl(remoteUrl);
    var query = req.url.split('?')[1] || '';
    if (query.length > 0) {
        fwdInfo.path += (fwdInfo.path.indexOf('?') > -1 ? '&' : '?') + query;
    }
    //debug
    //Handler.prototype.error(req, res, JSON.stringify(req.headers));
    //return;
    Handler.prototype.forward(req, res, fwdInfo);
};

Handler.prototype.forwardHost = function(req, res, rule) {
    var self = this;
    //以下是接受数据的代码
    var remoteUrl = rule.value;
    var fwdInfo = Handler.prototype.parseFwdUrl(remoteUrl);
    fwdInfo.path = req.url;
    //debug
    //Handler.prototype.error(req, res, JSON.stringify(req.headers));
    //return;
    Handler.prototype.forward(req, res, fwdInfo);
};

Handler.prototype.getFwdExp = function(url, expDic) {
    //console.log(url);
    var rule = null;
    for (var key in expDic) {
        var exp = new RegExp(key);
        if (exp.test(url)) {
            rule = {
                "key": key,
                "value": expDic[key]
            };
            break;
        }
    }
    return rule;
};

//处理转发，这个转发是一个不完整的转发，仅用来实现代理请求 “远程服务”
Handler.prototype.handleForward = function(req, res) {
    var self = this;
    var urlRule = self.getFwdExp(req.withoutQueryStringURL, self.configs.fwd_url);
    var hostRule = self.getFwdExp(req.withoutQueryStringURL, self.configs.fwd_host);
    //console.log(urlRule);
    if (urlRule) {
        //console.log("trigger url forward");
        self.forwardUrl(req, res, urlRule);
    } else if (hostRule) {
        //console.log("trigger host forward");
        self.forwardHost(req, res, hostRule);
    } else {
        //console.log("trigger local file");
        self.handleFileSystem(req, res);
    }
};