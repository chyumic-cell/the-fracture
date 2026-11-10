'use strict';
require('./browser-runtime.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/pc1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4088/art-review.html');
 await page.waitForSelector('#units article');await page.locator('#pause').click();const rows=[];
 for(const id of await page.locator('#faction option').evaluateAll(es=>es.map(e=>e.value))){
  await page.selectOption('#faction',id);const counts=await page.evaluate(()=>{const f=FD.factions[document.getElementById('faction').value];return{faction:f.id,units:f.units.length,buildings:f.buildings.length,actualUnits:document.querySelectorAll('#units article').length,actualBuildings:document.querySelectorAll('#buildings article').length};});assert.equal(counts.units,counts.actualUnits);assert.equal(counts.buildings,counts.actualBuildings);
  await page.selectOption('#category','naval');await page.locator('#units').scrollIntoViewIfNeeded();assert.equal(await page.locator('#units article:visible').count(),5);await page.waitForFunction(()=>[...document.querySelectorAll('#units article')].filter(e=>!e.hidden).every(e=>e.querySelector('canvas').dataset.rendered==='true'));
  const pixels=await page.locator('#units article:visible canvas').evaluateAll(cs=>cs.map(c=>[...c.getContext('2d').getImageData(0,0,c.width,c.height).data].filter((v,i)=>i%4===3&&v>0).length));assert(pixels.every(n=>n>100),id+' empty ships');rows.push(counts);
 }
 await page.selectOption('#faction','primates');await page.selectOption('#category','air');await page.locator('#units').scrollIntoViewIfNeeded();await page.waitForTimeout(350);await page.screenshot({path:'docs/art-review-primate-air.png'});
 await page.selectOption('#faction','humans');await page.selectOption('#category','fortifications');await page.locator('#fortifications').scrollIntoViewIfNeeded();await page.waitForTimeout(700);await page.screenshot({path:'docs/art-review-gates.png'});
 await page.selectOption('#category','buildings');await page.selectOption('#construction','ruin');await page.fill('#search',await page.evaluate(()=>FD.factions.humans.buildings.find(b=>b.kind==='hq').name));await page.locator('#buildings').scrollIntoViewIfNeeded();await page.waitForTimeout(300);assert.equal(await page.locator('#buildings article:visible').count(),1);await page.screenshot({path:'docs/art-review-ruins.png'});
 await page.fill('#search','nothingmatches');assert(await page.locator('#empty').isVisible());await page.fill('#search','');await page.selectOption('#category','naval');await page.selectOption('#playerColor','#cb756a');await page.waitForTimeout(300);await page.screenshot({path:'docs/art-review-ships.png'});
 assert.equal(await page.evaluate(()=>typeof fracture),'undefined','Preview must not create or replace a match');
 await page.goto(pathToFileURL('D:/TheFracture/art-review.html').href);await page.waitForSelector('#units article');await page.selectOption('#category','naval');await page.locator('#units').scrollIntoViewIfNeeded();await page.waitForTimeout(500);assert.equal(await page.locator('#units article:visible').count(),5);assert.deepEqual(errors,[]);
 fs.writeFileSync('docs/art-review-verification.json',JSON.stringify({factions:rows,offline:true,errors},null,2));console.log('PASS all 12 current rosters, 60 ships, controls, gates, ruins, filtered previews and offline page without loading a match');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
