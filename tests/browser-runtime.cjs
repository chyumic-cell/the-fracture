// Keep headless browser profiles and caches beside the D-drive project.
const path=require('node:path'),fs=require('node:fs');
const temp=path.resolve(__dirname,'../.test-tmp');
fs.mkdirSync(temp,{recursive:true});
process.env.TEMP=temp;
process.env.TMP=temp;
process.env.TMPDIR=temp;
