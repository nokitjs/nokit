/* global nokit */
/* global it */
/* global describe */
var assert = require("assert");
var app = require("./app");
var utils = nokit.utils;
var fs = require("fs");

describe('utils', function() {

  it('utils.normalizeUrl', function() {
    assert.notEqual(utils.normalizeUrl, null);
    var rs = utils.normalizeUrl("/localhost//test\\test");
    assert.equal(rs, "/localhost/test/test");
  });

  it('utils.normalizeUrl', function() {
    assert.notEqual(utils.normalizeUrl, null);
    var rs = utils.normalizeUrl("");
    assert.equal(rs, "");
  });

  it('utils.writeJSONSync', function() {
    assert.notEqual(utils.writeJSONSync, null);
    var jsonFile = __dirname + '/app/test.json';
    utils.writeJSONSync(jsonFile, { "test": "test" });
    var rs = utils.readJSONSync(jsonFile);
    assert.notEqual(rs, null);
    assert.equal(rs.test, 'test');
  });

  it('utils.copyDir', function() {
    assert.notEqual(utils.copyDir, null);
    var dirPath = __dirname + '/app/test-dir';
    utils.copyDir(dirPath, dirPath + '-new');
    var exists = fs.existsSync('/etc/passwd');
    assert.equal(exists, true);
  });

});