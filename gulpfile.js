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
var manifest     = require('gulp-manifest');
var ga           = require('gulp-ga');
var del          = require('del');
var path         = require('path');

var production   = process.env.NODE_ENV === 'production';
const revision = new Date().getTime();
const env = require('./.env.json');

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
      config.SRC_DIR + '/*.json',
      config.SRC_DIR + '/*.txt'
    ])
    .pipe(gulp.dest(config.BUILD_DIR + ''));
});

gulp.task('copy:img', function() {
  return gulp.src(config.SRC_DIR + '/img/**/*', {base: config.SRC_DIR + '/img'})
    .pipe(gulp.dest(config.BUILD_DIR + '/img'));
});

gulp.task('copy:font', function() {
  return gulp.src(config.SRC_DIR + '/fonts/**')
    .pipe(gulp.dest(config.BUILD_DIR + '/fonts'));
});

gulp.task('copy', [
  'copy:html',
  'copy:img',
  'copy:font'
]);

gulp.task('replace', function() {
  return gulp.src(config.BUILD_DIR + '/*.html')
    .pipe(ga({
      url: env.ga_url,
      uid: env.ga_uid,
      anonymizeIp: false,
      sendPageView: true
    }))
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
 | Cache manifest
 |--------------------------------------------------------------------------
 */
gulp.task('manifest', function(){
  return gulp.src([config.BUILD_DIR + '/**'], { base: config.BUILD_DIR })
    .pipe(manifest({
      timestamp: false,
      hash: true,
      preferOnline: true,
      network: ['*'],
      filename: 'app.manifest',
      exclude: 'app.manifest'
     }))
    .pipe(gulp.dest(config.BUILD_DIR));
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

gulp.task('clean', function () {
  return del([
    config.BUILD_DIR + '/**/*',
    // we don't want to clean this file though so we negate the pattern
    '!' + config.BUILD_DIR + '/.gitkeep',
  ]);
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
  return runSequence('clean', ['sass', 'copy'], 'replace', 'manifest', cb);
});
