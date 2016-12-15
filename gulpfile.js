var gulp         = require('gulp');
var gutil        = require('gulp-util');
var autoprefixer = require('gulp-autoprefixer');
var sass         = require('gulp-sass');
var concat       = require('gulp-concat');
var plumber      = require('gulp-plumber');
var source       = require('vinyl-source-stream');
var webserver    = require('gulp-webserver');
var runSequence  = require('run-sequence');
var rename       = require('gulp-rename');
var cssmin       = require('gulp-cssmin');
var gulpif       = require("gulp-if");
var htmlreplace  = require('gulp-html-replace');
var path         = require('path');

var production   = process.env.NODE_ENV === 'production';
const env = production ? 'production' : 'development'
const revision = new Date().getTime()

var config = {
  BOWER_DIR: './bower_components',
  SRC_DIR: './src',
  BUILD_DIR: './dist',
  NPM_DIR: './node_modules'
};

/*
 |--------------------------------------------------------------------------
 | Compile Sass stylesheets.
 |--------------------------------------------------------------------------
 */
gulp.task('sass', function() {
  return gulp.src(config.SRC_DIR + '/sass/app.scss')
    .pipe(plumber())
    .pipe(sass({
      includePaths: [
        path.join(__dirname, config.SRC_DIR + '/sass')
      ]
    }))
    .pipe(autoprefixer({
      "browsers": [
        "Android 2.3",
        "Android >= 4",
        "Chrome >= 20",
        "Firefox >= 24",
        "Explorer >= 8",
        "iOS >= 6",
        "Opera >= 12",
        "Safari >= 6"
      ]
    }))
    .pipe(gulpif(production, cssmin()))
    .pipe(gulpif(production, rename(`app.${revision}.min.css`)))
    .pipe(gulp.dest(config.BUILD_DIR + '/css'));
});

/*
 |--------------------------------------------------------------------------
 | Copy assets to build dir
 |--------------------------------------------------------------------------
 */
gulp.task('copy:html', function() {
  return gulp.src([
      config.SRC_DIR + '/*.html',
      config.SRC_DIR + '/*.png',
      config.SRC_DIR + '/*.xml',
      config.SRC_DIR + '/*.ico',
      config.SRC_DIR + '/*.svg',
      config.SRC_DIR + '/*.json'
    ])
    .pipe(gulp.dest(config.BUILD_DIR + ''));
});

gulp.task('copy:img', function() {
  return gulp.src(config.SRC_DIR + '/img/**/*', {base: config.SRC_DIR + '/img'})
    .pipe(gulp.dest(config.BUILD_DIR + '/img'));
});

gulp.task('copy', [
  'copy:html',
  'copy:img'
]);

gulp.task('replace', function() {
  return gulp.src(config.BUILD_DIR + '/index.html')
    .pipe(htmlreplace({
        'css': `/css/app.${revision}.min.css`,
    }))
    .pipe(gulp.dest(config.BUILD_DIR));
});


/*
 |--------------------------------------------------------------------------
 | WebServer
 |--------------------------------------------------------------------------
 */
gulp.task('webserver', () => {
  return gulp.src(config.BUILD_DIR)
    .pipe(webserver({
      livereload: true,
      fallback: 'index.html',
      open: true,
      port: 8001
    }));
});

/*
 |--------------------------------------------------------------------------
 | Watcher
 |--------------------------------------------------------------------------
 */
gulp.task('watch', function() {
  gulp.watch([
    config.SRC_DIR + '/sass/**/*.scss',
    config.SRC_DIR + '/sass/*.scss'
  ], ['sass']);

  gulp.watch(config.SRC_DIR + '/*.html', ['copy:html']);

  gulp.watch([
    config.SRC_DIR + '/img/**/*',
    config.SRC_DIR + '/img/*'
  ], ['copy:img']);
});

/*
 |--------------------------------------------------------------------------
 | Parent tasks
 |--------------------------------------------------------------------------
 */

gulp.task('default', function(cb) {
  return runSequence(['sass', 'copy'], 'webserver', 'watch', cb);
});

gulp.task('release', function(cb) {
  return runSequence(['sass', 'copy'], 'replace', cb);
});
