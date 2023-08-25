const { src, dest, watch, parallel, series } = require('gulp');

const scss = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const browserSync = require('browser-sync').create();
const autoprefixer = require('gulp-autoprefixer');
const clean = require('gulp-clean');
const avif = require('gulp-avif');
const webp = require('gulp-webp');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const fonter = require('gulp-fonter');
const ttf2woff2 = require('gulp-ttf2woff2');
const svgSprite = require('gulp-svg-sprite');

function styles() {
  return src('app/scss/style.scss')
    .pipe(autoprefixer({ overrideBrowserslist: ['last 10 version'] }))
    .pipe(concat('style.min.css'))
    .pipe(scss({ outputStyle: 'compressed' }))
    .pipe(dest('app/css'))
    .pipe(browserSync.stream())
}

function scripts() {
  return src('app/js/main.js')
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(dest('app/js'))
    .pipe(browserSync.stream())
}

function images() {
  return src(['app/images/src/*.*', '!app/images/src/*.svg'])
    .pipe(newer('app/images'))
    .pipe(avif({ quality: 50 }))

    .pipe(src('app/images/src/*.*'))
    .pipe(newer('app/images'))
    .pipe(webp())

    .pipe(src('app/images/src/*.*'))
    .pipe(newer('app/images'))
    .pipe(imagemin([
      imagemin.gifsicle({ interlaced: true }),
      imagemin.mozjpeg({ quality: 75, progressive: true }),
      imagemin.optipng({ optimizationLevel: 5 }),
      imagemin.svgo({
        plugins: [
          { removeViewBox: true },
          { cleanupIDs: false }
        ]
      })
    ]))
    .pipe(dest('app/images'))
}

function sprite() { // Для создания svg-спрайтов
  return src('app/images/*.svg')
    .pipe(svgSprite({
      mode: {
        stack: {
          sprite: '../sprite.svg',
          example: true
        }
      }
    }))
    .pipe(dest('app/images'))
}

function fonts() {
  return src('app/fonts/src/*.*')
    .pipe(fonter({
      formats: ['woff', 'ttf']
    }))
    .pipe(src('app/fonts/*.ttf'))
    .pipe(ttf2woff2())
    .pipe(dest('app/fonts'))
}

function watching() {
  browserSync.init({
    server: {
      baseDir: "app/"
    }
  });
  watch(['app/scss/**/*.scss'], styles)
  watch(['app/images/src'], images)
  watch(['app/js/**/*.js', '!app/js/main.min.js'], scripts)
  watch(['app/**/*.html']).on('change', browserSync.reload);
}

function cleanDist() {
  return src('docs')
    .pipe(clean())
}

function building() {
  return src([
    'app/css/style.min.css',
    'app/images/*.*',
   // '!app/images/*.svg',// Раскомментировать если создаётся svg-спрайт
    // 'app/images/sprite.svg', // Раскомментировать если создаётся svg-спрайт
    'app/fonts/*.*',
    'app/js/main.min.js',
    'app/*.html'
  ], { base: 'app' })
    .pipe(dest('docs'))
}

exports.styles = styles;
exports.images = images;
exports.sprite = sprite;
exports.fonts = fonts;
exports.scripts = scripts;
exports.watching = watching;
exports.building = building;

exports.build = series(cleanDist, fonts, building);

exports.default = parallel(styles, images, scripts, watching);