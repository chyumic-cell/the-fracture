/* Verifies production cue manifests against the actual bundled recordings in an isolated browser. */
require('./browser-runtime.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('C:/Users/pc1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],results=[];
 try{
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4088/');await page.waitForFunction(()=>window.FractureCinematic&&window.FractureCampaignStory);
 const scenes=await page.evaluate(()=>FractureCampaignStory.scenes);assert.equal(scenes.length,10);assert.deepEqual(scenes.map(s=>s.afterMission),[1,3,6,9,12,15,19,21,24,25]);
 for(const s of scenes){
  assert.equal(s.shots.length,5);assert(s.audio?.src&&s.audio.cuesVerified,`${s.id}: production narration mapping is not verified`);
  await page.evaluate(id=>FractureCinematic.open(FractureCampaignStory.scenes.find(s=>s.id===id),()=>{}),s.id);
  await page.waitForFunction(()=>FractureCinematic.audio&&Number.isFinite(FractureCinematic.audio.duration),null,{timeout:30000});
  const duration=await page.evaluate(()=>FractureCinematic.audio.duration),voiced=s.audio.availableShots||5;assert(s.audio.end<=duration+.2,`${s.id}: scene exceeds the recording`);
  if(await page.evaluate(()=>FractureCinematic.audio.paused))await page.locator('#cinematicPlay').click();await page.waitForFunction(()=>!FractureCinematic.audio.paused);await page.locator('#cinematicPlay').click();
  for(const [i,shot]of s.shots.entries()){
   if(i<voiced){assert(Number.isFinite(shot.start)&&Number.isFinite(shot.end)&&shot.end>shot.start&&shot.end<=duration+.2,`${s.id} image ${i+1}: invalid cue`);assert(!i||shot.start>=s.shots[i-1].end-.05,`${s.id}: overlapping cues`);
   await page.evaluate(t=>{FractureCinematic.audio.currentTime=t;},(shot.start+shot.end)/2);await page.waitForFunction(index=>document.getElementById('cinematicShot').textContent===`Passage ${index+1} of 5`,i);}else{assert.equal(shot.start,null,'Unrecorded passage must not invent an audio cue');assert.equal(shot.end,null);if(i===voiced){await page.evaluate(t=>FractureCinematic.audio.currentTime=t,s.audio.end-.01);await page.waitForFunction(index=>document.getElementById('cinematicShot').textContent===`Passage ${index+1} of 5`,i);assert.match(await page.locator('#cinematicStatus').textContent(),/Recording ends here/);}else await page.locator('#cinematicNext').click();}
   assert.equal(await page.evaluate(()=>FractureCinematic.audio.paused),true);
   if(process.env.CAMPAIGN_REQUIRE_ART==='1'){
    const imagePath=path.resolve('D:/TheFracture',shot.image);assert(fs.existsSync(imagePath),imagePath+' is missing');await page.waitForFunction(src=>[...document.querySelectorAll('.cinematic-stage img')].some(im=>im.getAttribute('src')===src&&im.classList.contains('visible')&&im.complete&&im.naturalWidth>0),shot.image);assert(await page.locator('#cinematicMissing').isHidden(),`${s.id}: missing illustration fallback is showing`);
   }
  }
  results.push({scene:s.id,recording:s.audio.src,duration,start:s.audio.start,end:s.audio.end,checkedShots:5,voicedShots:voiced,unrecordedPassages:5-voiced});
  await page.locator('#cinematicSkip').click();assert.equal(await page.evaluate(()=>FractureCinematic.audio),null);
 }
 // Replacement and teardown must not permit stale error/ended handlers to alter the next scene.
 await page.evaluate(()=>{FractureCinematic.open(FractureCampaignStory.scenes[0],()=>{});window.previousSceneAudio=FractureCinematic.audio;FractureCinematic.open(FractureCampaignStory.scenes[1],()=>{});});await page.waitForFunction(()=>Number.isFinite(FractureCinematic.audio.duration));assert(await page.evaluate(()=>window.previousSceneAudio.paused));assert.equal(await page.evaluate(()=>FractureCinematic.active.id),scenes[1].id);await page.locator('#cinematicSkip').click();assert.equal(errors.length,0,errors.join('\n'));
 fs.writeFileSync('D:/TheFracture/docs/cinematic-playback-results.json',JSON.stringify({checkedAt:new Date().toISOString(),verifiedAvailableNarrationCues:true,voicedPassages:results.reduce((n,s)=>n+s.voicedShots,0),totalPassages:50,requiredArt:process.env.CAMPAIGN_REQUIRE_ART==='1',scenes:results},null,2));console.log('PASS ten production cinematics: actual MP3 metadata/playback, '+results.reduce((n,s)=>n+s.voicedShots,0)+'/50 voiced passage cues, remaining passages explicitly manual, pause, skip, clean replacement'+(process.env.CAMPAIGN_REQUIRE_ART==='1'?', fifty available illustrations':' (art availability not required in this run)')+'.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
