/* global nokit */
/* global it */
/* global describe */
const assert = require("assert");
const app = require("./app");
const utils = nokit.utils;
const fs = require("fs");
const exec = require('child_process').execSync;

describe('utils', function () {

  it('utils.normalizeUrl', function () {
    assert.notEqual(utils.normalizeUrl, null);
    var rs = utils.normalizeUrl("/localhost//test\\test");
    assert.equal(rs, "/localhost/test/test");
  });

  it('utils.normalizeUrl', function () {
    assert.notEqual(utils.normalizeUrl, null);
    var rs = utils.normalizeUrl("");
    assert.equal(rs, "");
  });

  it('utils.writeJSONSync', function () {
    assert.notEqual(utils.writeJSONSync, null);
    var jsonFile = __dirname + '/app/test.json';
    utils.writeJSONSync(jsonFile, { "test": "test" });
    var rs = utils.readJSONSync(jsonFile);
    assert.notEqual(rs, null);
    assert.equal(rs.test, 'test');
  });

  it('utils.copyDir', function () {
    assert.notEqual(utils.copyDir, null);
    var dirPath = __dirname + '/app/test-dir';
    utils.copyDir(dirPath, dirPath + '-new');
    var exists = fs.existsSync(dirPath + '-new');
    assert.equal(exists, true);
    exec('rm -rf ' + dirPath + '-new');
  });

});