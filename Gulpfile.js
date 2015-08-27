var gulp = require("gulp");
var uglify = require("gulp-uglify");
var cssMinify = require("gulp-minify-css");
var htmlMin = require("gulp-htmlmin");
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var header = require('gulp-header');
var replace = require('gulp-replace');
var del = require('del');
var pkg = require("./package.json");

var banner = ['/**',
    ' * <%= rawName %>.js - <%= description %>',
    ' * @version v<%= version %>',
    ' * @link <%= homepage %>',
    ' * @license <%= license %>',
    ' * @author <%= author.name %>',
    ' * @email <%= author.email %>',
    ' */',
    ''
].join('\r\n');

//清理
gulp.task('clear', function(cb) {
    del(['./lib/resources/nsp-client.js',
        './lib/resources/common.css',
        './lib/resources/explore.css'
    ], cb);
});

//构建
gulp.task('build', ["clear"], function() {
    //nsp-client.js
    gulp.src("./lib/resources/nsp-client.src.js")
        .pipe(uglify())
        .pipe(header(banner, pkg))
        .pipe(rename("nsp-client.js"))
        .pipe(gulp.dest("./lib/resources/"));
    //common.css
    gulp.src("./lib/resources/common.src.css")
        .pipe(cssMinify())
        .pipe(header(banner, pkg))
        .pipe(rename("common.css"))
        .pipe(gulp.dest("./lib/resources/"));
    //explore.css
    gulp.src("./lib/resources/explore.src.css")
        .pipe(cssMinify())
        .pipe(header(banner, pkg))
        .pipe(rename("explore.css"))
        .pipe(gulp.dest("./lib/resources/"));
});

//默认任务
gulp.task('default', ["build"]);

//end