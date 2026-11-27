const fs = require("fs");
const esbuild = require("esbuild");
console.log("Removing old files...");
if (fs.existsSync("./dist")) fs.rmSync("./dist", { recursive: true });
console.log("Coping files...");
if (!fs.existsSync("./dist")) fs.mkdirSync("./dist");
//icons
fs.mkdirSync("./dist/icons");
const iconsList = fs.readdirSync("./assets/icons");
iconsList.forEach(icon => {
    fs.copyFileSync(`./assets/icons/${icon}`, `./dist/icons/${icon}`);
});
//other assets
const otherAssetsList = fs.readdirSync("./assets");
otherAssetsList.forEach(asset => {
    if (asset !== "icons") fs.copyFileSync(`./assets/${asset}`, `./dist/${asset}`);
});
console.log("Building...");
//gui
esbuild.buildSync({
    entryPoints: ["./src/inject/main.ts"],
    keepNames: true,
    bundle: true,
    outfile: "./dist/inject.js",
    minify: true,
    charset: "utf8",
    platform: "browser"
});
//预加载
esbuild.buildSync({
    entryPoints: ["./src/preload/main.ts"],
    bundle: true,
    outfile: "./dist/preload.js",
    minify: true,
    charset: "utf8",
    platform: "browser"
});
// worker预加载
esbuild.buildSync({
    entryPoints: ["./src/preload/workerMain.ts"],
    bundle: true,
    outfile: "./dist/preloadWorker.js",
    minify: true,
    charset: "utf8",
    platform: "browser"
});
// 设置页
esbuild.buildSync({
    entryPoints: ["./src/option/options.ts"],
    bundle: true,
    outfile: "./dist/options.js",
    // 不然提供给UserScript的接口会被混淆掉 然后全炸了
    // 鬼知道为啥keepNames没用
    minifyWhitespace: true,
    charset: "utf8",
    platform: "browser"
});
//其他
esbuild.buildSync({
    entryPoints: ["./src/content.ts", "./src/service/daemon.ts"],
    bundle: true,
    outdir: "./dist",
    minify: true,
    charset: "utf8",
    platform: "browser"
});
console.log("Success!");