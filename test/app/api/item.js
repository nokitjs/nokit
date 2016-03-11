/**
 * ItemController
 **/
var ItemController = function() { };

/**
 * 初始化方法，每次请求都会先执行 init 方法
 **/
ItemController.prototype.init = function() {
  var self = this;
  self.ready();
}

/**
 * Create (POST)
 **/
ItemController.prototype.post = function() {
  var self = this;
  self.send({
    "name": "POST"
  });
}

/**
 * Read (GET)
 **/
ItemController.prototype.get = function() {
  var self = this;
  self.send({
    "name": "GET"
  });
}

/**
 * Update (PUT)
 **/
ItemController.prototype.put = function() {
  var self = this;
  self.send({
    "name": "PUT"
  });
}

/**
 * Delete (DELETE)
 **/
ItemController.prototype.delete = function() {
  var self = this;
  self.send({
    "name": "DELETE"
  });
}

module.exports = ItemController;