const gulp = require("gulp");
const uglify = require("gulp-uglify");
const cssnano = require('gulp-cssnano');
const htmlMin = require("gulp-htmlmin");
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const header = require('gulp-header');
const replace = require('gulp-replace');
const del = require('del');
const pkg = require("./package.json");

const banner = ['/**',
  ' * <%= displayName %> - <%= description %>',
  ' * @version v<%= version %>',
  ' * @link <%= homepage %>',
  ' * @license <%= license %>',
  ' * @author <%= author.name %>',
  ' * @email <%= author.email %>',
  ' */',
  ''
].join('\r\n');

//清理
gulp.task('clear', function (cb) {
  del(['./lib/resources/javascripts/nsp-client.js',
    './lib/resources/stylesheets/common.css',
    './lib/resources/stylesheets/explore.css'
  ], cb);
});

//构建
gulp.task('build', ["clear"], function () {
  //nsp-client.js
  gulp.src("./lib/resources/javascripts/nsp-client.src.js")
    .pipe(uglify())
    .pipe(header(banner, pkg))
    .pipe(rename("nsp-client.js"))
    .pipe(gulp.dest("./lib/resources/javascripts/"));
  //common.css
  gulp.src("./lib/resources/stylesheets/common.src.css")
    .pipe(cssnano())
    .pipe(header(banner, pkg))
    .pipe(rename("common.css"))
    .pipe(gulp.dest("./lib/resources/stylesheets/"));
  //explore.css
  gulp.src("./lib/resources/stylesheets/explore.src.css")
    .pipe(cssnano())
    .pipe(header(banner, pkg))
    .pipe(rename("explore.css"))
    .pipe(gulp.dest("./lib/resources/stylesheets/"));
  //mvc package.json
  gulp.src("./examples/mvc/_package.json")
    .pipe(rename("package.json"))
    .pipe(replace("{version}", pkg.version))
    .pipe(gulp.dest("./examples/mvc/"));
  //nsp package.json
  gulp.src("./examples/nsp/_package.json")
    .pipe(rename("package.json"))
    .pipe(replace("{version}", pkg.version))
    .pipe(gulp.dest("./examples/nsp/"));
  //rest package.json
  gulp.src("./examples/rest/_package.json")
    .pipe(rename("package.json"))
    .pipe(replace("{version}", pkg.version))
    .pipe(gulp.dest("./examples/rest/"));
});

//默认任务
gulp.task('default', ["build"]);

//end