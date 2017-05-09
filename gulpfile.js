//引用node和第三方模块 
var gulp = require('gulp');
//按顺序执行一系列有前后依赖关系的gulp任务 https://github.com/OverZealous/run-sequence
var runSequence = require('run-sequence');
//现在有了原生的fs，但他们是一个东西  https://github.com/jprichardson/node-fs-extra
var fs = require('fs');
//操作文件和目录路径  https://github.com/jinder/path
var path = require('path');
//分析处理url  https://github.com/defunctzombie/node-url
var url = require('url');
//开启异步任务支持  run a command in a shell
var exec = require('child_process').exec;
//提供javascript常用的功能函数  https://github.com/lodash/lodash
var _ = require('lodash');
//异步相关 https://github.com/caolan/async
var async = require('async');
//http客户端  https://github.com/request/request
var request = require('request');
//删除文件文件夹 https://github.com/sindresorhus/del
var del = require('del'); 
//以vinyl stream的格式获取文件路径 https://github.com/sindresorhus/vinyl-paths
var vinylPaths = require('vinyl-paths');
//服务器    https://github.com/gimm/gulp-live-server
var gls = require('gulp-live-server');


//引入gulp功能
//sass to css compass插件    https://github.com/appleboy/gulp-compass
var compass = require('gulp-compass'),
//修改静态资源版本号content hash    https://github.com/sindresorhus/gulp-rev
    rev = require('gulp-rev'),
//压缩js文件   https://github.com/terinjokes/gulp-uglify
    uglify = require('gulp-uglify'),
//压缩css    https://github.com/nfroidure/gulp-minify-css
    minifyCss = require('gulp-minify-css'),
//压缩图片   https://github.com/sindresorhus/gulp-imagemin
    imagemin = require('gulp-imagemin'),
//压缩html   https://github.com/sanfords/gulp-minify-html
    minifyHtml = require('gulp-minify-html'),
//保存文件到硬盘
    savefile = require('gulp-savefile'),
//
    webpack = require('gulp-webpack'),
//https://github.com/rehorn/gulp-htmlrefs
    htmlrefs = require('gulp-htmlrefs'),
//zip压缩文件   https://github.com/sindresorhus/gulp-zip
    zip = require('gulp-zip'),
//拓展html，引入替换之类的功能   https://github.com/FrankFang/gulp-html-extend
    extender = require('gulp-html-extend'),
//按照条件判断运行那个任务    https://github.com/robrich/gulp-if
    gulpIf = require('gulp-if'),
//源文件比对应dst 文件要新的时候才传递过去   https://github.com/tschaub/gulp-newer
    newer = require('gulp-newer');

// 配置信息
var configs = {
    //项目信息
    name: 'test',
    cdn: '',
    webServer: 'http://topsunny.cn/',

    // path 相关
    src: './src/',
    dist: './dist/',
    tmp: './.tmp/',
    cssRev: './.tmp/.cssrev/',
    jsRev: './.tmp/.jsrev/',

    //提交服务器地址
    publishUrl: 'http://192.168.1.14/test/',
    //预览地址
    preview: '',

    // webpack
    webpack: {},

    // 图片格式
    // imgType: '*.{jpg,jpeg,png,bmp,gif,ttf,ico,htc}',
    imgType: '*.*'
};

var opt = {
    //https://github.com/gulpjs/gulp/blob/master/docs/API.md
    cwd: configs.src,
    base: configs.src
}

console.log('开始编译项目： [' + configs.name + ']...');

//下面就是gulp任务了
//移除旧的临时的文件，传cb触发异步任务
gulp.task('clean', function(cb) {
    del([configs.dist, configs.tmp], cb);
});

// clean node_modules, fix windows file name to long bug..
gulp.task('cleanmod', function(cb) {
    del('./node_modules', cb);
});

// 复制things2copy定义的文件到dist
var things2copy = ['*.{html,ico}', 'libs/**/*.*', 'js/*.js' + configs.imgType];
gulp.task('copy', function() {
    return gulp.src(things2copy, opt)
        .pipe(newer(configs.dist))
        .pipe(gulpIf('*.html', extender()))
        .pipe(gulp.dest(configs.dist));
});

// 复制图片到dist并加上md5 [格式filename-md5.png]
var image2copy = '{img/,img/common/}' + configs.imgType;
gulp.task('img-rev', function() {
    // img root 
    return gulp.src(image2copy, opt)
        .pipe(newer(configs.dist))
        .pipe(rev())
        .pipe(gulp.dest(configs.dist));
});

// 编译 scss  和 sprite, sprite图片有加md5
var scss2compile = ['css/*.scss'];
gulp.task('compass', function() {
    return gulp.src(scss2compile, opt)
        .pipe(newer(configs.dist))
        .pipe(compass({
            config_file: './config.rb',
            css: path.join(configs.dist, 'css'),
            sass: path.join(configs.src, 'css'),
            image: path.join(configs.src, 'img'),
            generated_image: path.join(configs.dist, 'img/sprite')
        }));
});

//压缩dist里的CSS-md5
var css2min = [configs.dist + '/css/*.css'];
gulp.task('minifycss', ['compass'], function() {
    return gulp.src(css2min)
        .pipe(minifyCss())
        .pipe(vinylPaths(del))
        .pipe(rev())
        .pipe(savefile())
        .pipe(rev.manifest())
        .pipe(gulp.dest(configs.cssRev));
});

//压缩js到dist md5
var js2min = ['{js,js/common}/*.js'];
gulp.task('uglify', function() {
    return gulp.src(js2min, opt)
        .pipe(newer(configs.dist))
        .pipe(uglify())
        .pipe(rev())
        .pipe(gulp.dest(configs.dist));
});

// 替换 html/js/css  相对资源，改用新的md5资源  inline js to html, or base64 to img
gulp.task('htmlrefs', function() {
    var mapping;
    var jsRev = configs.jsRev + 'rev-manifest.json';
    var cssRev = configs.cssRev + 'rev-manifest.json';
    if (fs.existsSync(jsRev) && fs.existsSync(cssRev)) {
        mapping = _.extend(
            require(jsRev),
            require(cssRev)
        );
    }
    var refOpt = {
        urlPrefix: configs.cdn,
        scope: [configs.dist],
        mapping: mapping
    };
    return gulp.src(configs.dist + '*.html')
        .pipe(htmlrefs(refOpt))
        .pipe(gulp.dest(configs.dist));
});

//压缩dist目录的html
gulp.task('minifyhtml', function() {
    return gulp.src(configs.dist + '*.html')
        .pipe(minifyHtml({
            empty: true
        }))
        .pipe(savefile());
});

//压图
gulp.task('minifyimg', function() {
    return gulp.src('src/img/{common,static}/' + configs.imgType)
        .pipe(imagemin())
        .pipe(rev())
        .pipe(gulp.dest(configs.dist+'img/'));
});

//服务器
gulp.task('server', function(cb) {
    var server = gls.static('dist', 7777);
    server.start();

    gulp.watch([configs.dist+'*'], function (file) {
        server.notify.apply(server, [file]);
    });
});

//监听文件变化
gulp.task('watch', function() {
    gulp.watch(things2copy, opt, ['copy']);
    gulp.watch(image2copy, opt, ['img-rev']);
    gulp.watch(scss2compile, opt, ['compass']);
});

// 提交文件到服务器
gulp.task('publish', function() {
    // publish ars
    request.post(configs.publishUrl, {
        form: data
    }, function(err, resp, body) {
        var data = JSON.parse(body);
        if (data.code == 0) {
            var msg = JSON.parse(data.msg);
            if (!msg.result) {
                console.log('提交失败！');
            } else {
                openBrowser(configs.preview);
            }
        }
    });
});

gulp.task('dev', function(cb) {
    runSequence(['clean'], ['copy', 'img-rev', 'compass'], 'watch', 'server', cb);
});

gulp.task('dist', function(cb) {
    runSequence('clean', ['copy', 'img-rev', 'compass', 'uglify', 'minifyCss'], 'htmlrefs', cb);
});

gulp.task('default', ['dev']);
