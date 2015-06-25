// Requirements to run tests: 
// 
// - Chrome
// - Firefox
// - Opera Stable, Beta and Developer
// 
// If only Opera Stable is installed, run
// test with `--no-operaversions`

var test = require('tape')
  , detect = require('./')

var argv = require('yargs')
  .boolean('operaversions')
  .default({ operaversions : true })
  .argv;

test('detect all', function(t){
  t.plan(6)

  detect(function(results){
    var names = results.map(function(b){ return b.name })

    t.ok(names.indexOf('chrome')>=0, 'found chrome')
    t.ok(names.indexOf('firefox')>=0, 'found firefox')
    t.ok(names.indexOf('ie')>=0, 'found ie')
    t.ok(names.indexOf('opera')>=0, 'found opera')
    t.ok(names.indexOf('phantomjs')>=0, 'found phantomjs')

    var len = results.filter(hasVersion).length
    t.equal(len, results.length, 'have version numbers')
  })
})

test('detect chrome', function(t){
  t.plan(1)

  detect('chrome', function(results){
    t.equal(results[0].name, 'chrome', 'has name')
  })
})

test('detect chrome without version', function(t){
  t.plan(2)

  detect('chrome', {version: false}, function(results){
    t.equal(results[0].name, 'chrome', 'has name')
    t.notOk(results[0].version, 'has no version')
  })
})

test('detect chrome and firefox', function(t){
  t.plan(3)

  detect(['chrome', 'firefox'], function(results){
    var names = results.map(function(b){ return b.name })

    t.ok(names.indexOf('chrome')>=0, 'found chrome')
    t.ok(names.indexOf('firefox')>=0, 'found firefox')

    var len = results.filter(hasVersion).length
    t.ok(len>=2, 'have version numbers')
  })
})

var ot = argv.operaversions ? test : test.skip
ot('detect all opera versions', function(t){
  t.plan(2)

  detect('opera', function(results){
    t.equal(results.length, 3)

    var versions = results.map(function(b){ return b.version })
    var uniq = versions.filter(function(v, i){
      return versions.lastIndexOf(v)===i
    })

    t.equal(uniq.length, 3, 'unique versions')
  })
})

test('detect first opera version', function(t){
  t.plan(1)

  detect('opera', {lucky: true}, function(results){
    t.equal(results.length, 1)
  })
})

test('detect local phantomjs', function(t){
  t.plan(2)

  detect('phantomjs', function(results){
    t.equal(results[0].name, 'phantomjs')
    t.ok(hasVersion(results[0]), 'has version')
  })
})

function hasVersion(b){ 
  return b.version && b.version.match(/[\d\.]+/)
}
