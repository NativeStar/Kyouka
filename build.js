const fs = require("fs");
const esbuild = require("esbuild");
console.log("Removing old files...");
if (fs.existsSync("./dist")) fs.rmSync("./dist",{recursive:true});
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
    entryPoints:["./src/inject/main.ts"],
    keepNames:true,
    bundle:true,
    outfile:"./dist/inject.js",
    minify:true,
    charset:"utf8",
    platform:"browser"
});
//预加载
esbuild.buildSync({
    entryPoints:["./src/preload/main.ts"],
    keepNames:true,
    bundle:true,
    outfile:"./dist/preload.js",
    minify:true,
    charset:"utf8",
    platform:"browser"
})
//其他
esbuild.buildSync({
    entryPoints:["./src/content.ts","./src/service.ts","./src/options.ts"],
    keepNames:true,
    bundle:true,
    outdir:"./dist",
    minify:true,
    charset:"utf8",
    platform:"browser"
});
console.log("Success!");