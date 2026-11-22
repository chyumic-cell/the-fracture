'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),report=path.join(root,'.test-tmp','scorecard-regression-'+process.pid+'.json');
const run=spawnSync(process.execPath,['tests/ai-ladder-scorecard.cjs'],{cwd:root,encoding:'utf8',timeout:30000,env:{...process.env,AI_SOURCE:'src',AI_PAIRS:'3:2',AI_MATCHES:'2',AI_SECONDS:'.15',AI_SIZES:'48',AI_LAYOUTS:'natural',AI_FACTIONS:'humans',AI_REPORT:report}});
assert.equal(run.status,0,run.stderr||run.stdout);const r=JSON.parse(fs.readFileSync(report,'utf8'));
assert.equal(r.cases.length,2);assert.equal(r.summary[0].inTargetBand,false);assert.equal(r.summary[0].batchStatus,'unresolved');
assert.equal(r.summary[0].unresolved,2);assert.equal(r.summary[0].lowerWinRateOfCompleted,null);
for(const c of r.cases)for(const s of Object.values(c.score)){assert.equal(s.militaryProduced,0,'Starting workers are not military production');assert.equal(s.militaryLost,0);}
assert(r.runnerHash);assert(r.hashes['ai.js']);
console.log('PASS real scorecard excludes starting workers, fingerprints its runner, and cannot certify unresolved games');
