const fs = require("fs");
if (fs.existsSync("./dist")) fs.rmSync("./dist",{recursive:true});
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