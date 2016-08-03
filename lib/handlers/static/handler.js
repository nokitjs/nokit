/**
 * 静态文件处理器
 */
const fs = require('fs');
const path = require('path');

const ALLOWED_METHODS = ["GET"];

const Handler = module.exports = function(server) {
  var self = this;
  self.server = server;
  self.configs = self.server.configs;
  self.configs.static = self.configs.static || {};
  self.configs.cache = self.configs.cache || {};
  self.utils = self.server.require('$./core/utils');
  self.Task = self.server.require('$./core/task');
};

//处理请求
Handler.prototype.handle = function(context) {
  var self = this;
  try {
    self.handleFileSystem(context);
  } catch (ex) {
    context.error(ex.message);
  }
};

//查找默认文档
Handler.prototype.findDefaultFile = function(folder, callback) {
  var self = this;
  if (!callback) return;
  var task = self.Task.create();
  self.utils.each(self.configs.defaults, function(filename, status) {
    if (!status) return;
    task.add(filename, function(done) {
      var filePath = path.resolve(folder, filename);
      fs.exists(filePath, function(exists) {
        done(null, exists);
      });
    });
  });
  task.end(function() {
    for (var filename in task.result) {
      if (task.result[filename] === true) {
        return callback(filename);
      }
    };
    callback(null);
  });
};

//处理文件系统
Handler.prototype.handleFileSystem = function(context) {
  var self = this;
  context.request.physicalPathExists(function(exists) {
    //如果不存在物理文件
    if (!exists) {
      context.notFound();
      return;
    } else {
      //如果是目录
      context.request.physicalPathStat(function(stats) {
        context.shouldCompress = self.configs.static.compress;
        context.shouldCache = self.configs.static.cache;
        if (stats.isDirectory()) {
          //如果目录的 url 不是以 / 结尾，向浏览器发出 302 重定向，
          //否则会导致样式等相对路径错误。
          if (!(new RegExp('/$')).test(context.request.withoutQueryStringURL)) {
            self.correctFolder(context);
            return;
          }
          //查找默认文档
          self.findDefaultFile(context.request.physicalPath, function(filename) {
            if (filename) {
              self.handleDefaultFile(context, filename);
            } else {
              self.browseFolder(context);
            }
          });
        } else {
          //如果是文件
          self.writeFile(context);
        }
      });
    }
  });
};

/**
 * 修正目录的 URL
 **/
Handler.prototype.correctFolder = function(context) {
  var self = this;
  var url = context.request.url;
  if (url.indexOf('?') > -1) {
    var urlParts = url.split('?');
    context.redirect(urlParts[0] + "/?" + urlParts[1]);
  } else {
    context.redirect(url + "/");
  }
};

/**
 * 处理默认文档
 **/
Handler.prototype.handleDefaultFile = function(context, filename) {
  var self = this;
  var url = context.request.url;
  if (url.indexOf('?') > -1) {
    var urlParts = url.split('?')
    url = urlParts[0] + filename + "?" + urlParts[1];
  } else {
    url = url + filename;
  }
  context.transfer(url);
};

/**
 * 检查当前目录是否允许 “浏览目录”
 **/
Handler.prototype._checkBrowseFolderStatus = function(context) {
  var self = this;
  var status = false;
  self.utils.each(self.configs.browseFolder, function(_expr, _status) {
    if ((new RegExp(_expr)).test(context.request.withoutQueryStringURL)) {
      status = _status;
    }
  });
  return status;
};

/**
 * 生成目录浏览的各层级链接
 **/
Handler.prototype._genFolderLinks = function(url) {
  var urlParts = url.split('/');
  var record = [];
  var buffer = [];
  urlParts.forEach(function(item) {
    if (item != '') {
      record.push(item);
      buffer.push('<a href="/' + record.join('/') + '/">' + item + '</a>');
    }
  });
  return "/" + buffer.join('/');
};

/**
 * 浏览目录
 **/
Handler.prototype.browseFolder = function(context) {
  var self = this;
  //检查当前目录是否允许 “浏览目录”
  if (!self._checkBrowseFolderStatus(context)) {
    context.notFound();
    return;
  }
  // satic 只允许 get 请求 
  // method 的检查不能太早，因为还有机会 transfer 到其它 handler
  if (ALLOWED_METHODS.indexOf(context.request.method) < 0) {
    context.notAllowed();
    return;
  }
  fs.readdir(context.request.physicalPath, function(err, files) {
    if (err) {
      context.error(err);
      return;
    }
    var items = [];
    var task = self.Task.create();
    files.forEach(function(item) {
      var itemPath = path.normalize(context.request.physicalPath + '/' + item);
      task.add(function(done) {
        fs.stat(itemPath, function(err, stats) {
          if (err) {
            return context.error(err);
          }
          items.push({
            name: item,
            type: stats.isDirectory() ? 'folder' : 'file'
          });
          done();
        });
      });
    });
    task.end(function() {
      var model = {
        server: self.server,
        handler: self,
        request: context.request,
        items: self._sortFSItems(items),
        pathLinks: self._genFolderLinks(context.request.withoutQueryStringURL)
      };
      context.template("explore", model, self.server.mime('.html'));
    });
  });
};

/**
 * 排序文件或目录
 **/
Handler.prototype._sortFSItems = function(items) {
  var typeVals = {
    "folder": 0,
    "file": 1,
  };
  return items.sort(function(a, b) {
    var aVal = typeVals[a.type] + ':' + a.name;
    var bVal = typeVals[b.type] + ':' + b.name;
    if (aVal < bVal) {
      return -1;
    } else if (aVal > bVal) {
      return 1;
    } else {
      return 0;
    }
  });
};

/**
 * 输出静态文件
 **/
Handler.prototype.writeFile = function(context) {
  var self = this;
  // satic 只允许 get 请求
  // method 的检查不能太早，因为还有机会 transfer 到其它 handler
  if (ALLOWED_METHODS.indexOf(context.request.method) < 0) {
    context.notAllowed();
    return;
  }
  if (self.configs.cache.lastModified) {
    context.request.physicalPathStat(function(stat) {
      var modifiedSince = context.request.headers['if-modified-since'];
      modifiedSince = modifiedSince ? new Date(modifiedSince) : null;
      var lastModified = stat.mtime;
      if (self.utils.isNull(modifiedSince) || modifiedSince < lastModified) {
        context.file(context.request.physicalPath, null, null, {
          'Last-Modified': lastModified.toUTCString()
        });
      } else {
        context.noChange();
      }
    });
  } else {
    context.file(context.request.physicalPath);
  }
};