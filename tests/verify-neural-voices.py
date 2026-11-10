import json,hashlib,sys
from pathlib import Path
sys.path.insert(0,'D:/TheFracture/.art-work/voice-tools')
import numpy as np,soundfile as sf
root=Path('D:/TheFracture');manifest=json.loads((root/'.art-work/neural-voice-manifest.json').read_text());files={};unique={};missing=[]
for unit in list(manifest['units'].values())+[{'categories':manifest['alerts']}]:
 for category,lines in unit['categories'].items():
  assert len(lines)>=3
  if unit.get('faction')!='symbiotes':assert len(set(l['text'] for l in lines))==len(lines)
  for line in lines:
   paths=[line['path'].replace('.ogg','-layer'+str(i)+'.ogg') for i in range(line['layers'])] if line['layers']>1 else [line['path']]
   hashes=[]
   for rel in paths:
    path=root/rel
    if not path.exists():missing.append(rel);continue
    payload=path.read_bytes();h=hashlib.sha256(payload).hexdigest();hashes.append(h);files[rel]=len(payload)
    if h in unique:continue
    samples,rate=sf.read(path);peak=float(np.abs(samples).max());duration=len(samples)/rate
    assert np.isfinite(samples).all() and .01<peak<=1.01 and .2<duration<25,(rel,peak,duration)
    unique[h]={'duration':duration,'peak':peak}
   if line['layers']>1:assert len(set(hashes))==5,(line['path'],hashes)
assert not missing,missing[:20]
report={'units':len(manifest['units']),'files':len(files),'uniqueRecordings':len(unique),'bytes':sum(files.values()),'durationSeconds':[min(q['duration'] for q in unique.values()),max(q['duration'] for q in unique.values())],'checked':'All referenced files exist, decode, have finite non-silent audio; five separate recordings per collective line.'}
(root/'docs/voice-assets-verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
