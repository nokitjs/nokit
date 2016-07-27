/* global nokit */
/* global it */
/* global describe */
const assert = require("assert");
const app = require("./app");
const base64 = nokit.base64;

describe('define', function() {

  it('定义一个类型', function(done) {
    var Cat = nokit.define({
      getName: function* () {
        try {
          var s = yield nokit.generator.sleep(0);
        } catch (ex) {
          throw ex;
        }
        return "cat";
      }
    });
    assert.equal(typeof Cat, 'function');
    var cat = new Cat();
    assert.notEqual(cat, null);
    assert.notEqual(cat.getName.constructor.name, "GenoratorFunction");
    cat.getName().then(function(name) {
      try {
        assert.equal(name, 'cat');
        done(null, name);
      } catch (err) {
        done(err);
      }
    });
  });

});