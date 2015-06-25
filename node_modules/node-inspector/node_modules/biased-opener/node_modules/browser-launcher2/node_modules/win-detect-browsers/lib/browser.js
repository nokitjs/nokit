var wmicVersion = require('./wmic-version')
  , debug       = require('debug')('win-detect-browsers')
  , browsers    = require('./browsers')
  , exec        = require('./exec')

module.exports = Browser

function Browser(name, path, version) {
  this.name = name
  this.path = path
  this.version = null
  this.setVersion(version)
}

Browser.prototype.setVersion = function(version) {
  var m = version && /[\d\.]+/.exec(version)
  if (m) this.version = m[0]
};

Browser.prototype.getVersion = function(cb) {
  if (this.version) return cb(null, this.version)

  var browser = this

  this.getVersionWithFlag(function(err, version){
    if (err) debug(err)
    else if (version) {
      // TODO: only return if version was succesfully parsed
      browser.setVersion(version)
      return cb(null, version)
    }
    
    wmicVersion(browser.path, function(err, version){
      if (err) debug(err)
      if (version) browser.setVersion(version)
      cb(null, version)
    })
  })
}

Browser.prototype.getVersionWithFlag = function(cb) {
  var opts = browsers[this.name]
  var args = opts && opts.getVersion

  if (!args) return cb()

  debug('get version with %s %s', this.path, args)
  exec(this.path, [args], false, cb)
}
