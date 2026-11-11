from pathlib import Path
import sys,json,math
R=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(R/'.art-work/speech-tools'))
import av,numpy as np
report=json.loads((R/'docs/campaign-narration-pacing.json').read_text())
def decode(path):
 parts=[]
 with av.open(str(path)) as c:
  res=av.AudioResampler(format='flt',layout='mono',rate=16000)
  for f in c.decode(audio=0):
   for o in res.resample(f):parts.append(o.to_ndarray().flatten())
  for o in res.resample(None):parts.append(o.to_ndarray().flatten())
 return np.concatenate(parts)
results=[]
for f in report['files']:
 a,b=decode(R/f['original']),decode(R/f['edited']);expected=sum(e['seconds'] for e in f['insertions']);error=abs((len(b)-len(a))/16000-expected);assert error<.08,error
 assert np.isfinite(b).all();checks=[]
 for t in range(10,int(len(a)/16000)-5,23):
  if any(t-1<e['at']<t+4 for e in f['insertions']):continue
  shift=sum(e['seconds'] for e in f['insertions'] if e['at']<=t);i=round(t*16000);j=round((t+shift)*16000);x=a[i:i+32000]
  if np.mean(x*x)<1e-6:continue
  values=[]
  for lag in range(-16,17):
   y=b[j+lag:j+lag+len(x)];values.append(float(np.dot(x,y)/(math.sqrt(float(np.dot(x,x))*float(np.dot(y,y)))+1e-12)))
  corr=max(values);assert corr>.97,(f['edited'],t,corr);checks.append({'sourceTime':t,'editedTime':round(t+shift,3),'correlation':round(corr,6)})
 results.append({'file':f['edited'],'insertedPauses':len(f['insertions']),'durationErrorSeconds':error,'speechWindows':checks,'allFinite':True})
 print('PASS',f['edited'],len(checks),'speech-preservation windows; minimum correlation',min(x['correlation'] for x in checks))
(R/'docs/campaign-narration-quality.json').write_text(json.dumps({'method':'Decode original and paced audio, verify inserted duration and finite samples, compare unchanged speech windows by normalized correlation allowing codec sample rounding. Not a listening-panel certification.','files':results},indent=2))
