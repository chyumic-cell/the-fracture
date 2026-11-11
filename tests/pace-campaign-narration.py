"""Edit supplied narration non-destructively, using existing ASR word alignments."""
from pathlib import Path
import sys,json,re,difflib,math
from fractions import Fraction
R=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(R/'.art-work/speech-tools'))
import av,numpy as np
story=json.loads((R/'docs/narration-source/story.json').read_text(encoding='utf-8-sig'))
def norm(t):return re.findall(r'[a-z0-9]+',t.lower().replace('’',"'"))
report={'method':'Canonical sentence endings aligned with existing local word timestamps. Insert silence only at sentence boundaries; preserve the original recordings and narrator. Captions and passage cues remapped to edited audio.','files':[],'skipped':[]}
for rec in story['recordings']:
 source=rec['src'];name=Path(source).stem
 tr=json.loads((R/('docs/narration-source/'+name.replace(' ','-')+'.json')).read_text(encoding='utf-8-sig'))
 words=[w for seg in tr['segments'] for w in seg['words']]
 sentences=[]
 for scene in [s for s in story['scenes'] if s['audio']['src']==source]:
  for shot in scene['shots']:
   if shot.get('start') is None:continue
   local=[w for w in words if shot['start']<=w['start']<shot['end']]
   tokens=[];times=[]
   for w in local:
    for token in norm(w['word']):tokens.append(token);times.append((w['start'],w['end']))
   canonical=[];ranges=[]
   for text in re.split(r'(?<=[.!?])\s+',shot['text'].strip()):
    a=len(canonical);canonical+=norm(text);ranges.append((a,len(canonical),text))
   matched={}
   for b in difflib.SequenceMatcher(None,canonical,tokens,autojunk=False).get_matching_blocks():
    for k in range(b.size):matched[b.a+k]=times[b.b+k]
   for a,b,text in ranges:
    found=[matched[k] for k in range(a,b) if k in matched]
    if found:sentences.append({'text':text,'start':found[0][0],'end':found[-1][1],'edge':a in matched and b-1 in matched,'confidence':len(found)/max(1,b-a),'shot':scene['id']+'/'+shot['id']})
 sentences.sort(key=lambda s:s['start'])
 with av.open(str(R/source)) as c:
  res=av.AudioResampler(format='fltp',layout='stereo',rate=44100);parts=[]
  for f in c.decode(audio=0):
   for o in res.resample(f):parts.append(o.to_ndarray())
  for o in res.resample(None):parts.append(o.to_ndarray())
 pcm=np.concatenate(parts,axis=1);rate=44100;edits=[]
 for a,b in zip(sentences,sentences[1:]):
  gap=b['start']-a['end'];desired=1.15 if a['shot']!=b['shot'] else .68
  if b['text']=='I can still hear the glass breaking.':desired=1.7
  if gap>=desired:continue
  if not a['edge'] or not b['edge'] or min(a['confidence'],b['confidence'])<.72 or gap<-.06:
   report['skipped'].append({'recording':name,'after':a['text'],'reason':'Uncertain word boundary; left unchanged.'});continue
  midpoint=(a['end']+b['start'])/2
  # Search only the aligned inter-word boundary, never through a sentence.
  lo=max(0,int((midpoint-.025)*rate));hi=min(pcm.shape[1]-500,int((midpoint+.025)*rate))
  positions=range(lo,max(lo+1,hi),44)
  cut=min(positions,key=lambda p:float(np.mean(pcm[:,max(0,p-110):p+110]**2)))
  add=round(max(0,desired-max(0,gap))*rate)
  if add>0:edits.append({'sample':cut,'at':cut/rate,'seconds':add/rate,'samples':add,'originalGap':round(gap,3),'after':a['text'],'before':b['text']})
 # Four run-together sentence boundaries have ASR spelling substitutions
 # (Thread/threat, survived/survive). Inspect their adjoining word timestamps
 # explicitly instead of treating the recognition spelling as new dialogue.
 reviewed={'The Empty Box':[(91.82,'where the lid had lifted.','Thread had left without waking us.'),(205.4,'For a time, it was difficult to argue.','Thread could organize shelter')],
 'The Sound of Glass':[(72.52,"For a long time, I did not know whether my friends had survived.",'News came from places I could not reach.'),(320.72,'In the end, they had needed one another to survive.','I wish I could say that made them wise.')]}
 for at,before,after in reviewed.get(name,[]):
  if any(abs(e['at']-at)<.1 for e in edits):continue
  lo=int((at-.025)*rate);hi=int((at+.025)*rate)
  cut=min(range(lo,hi,44),key=lambda p:float(np.mean(pcm[:,p-110:p+110]**2)))
  edits.append({'sample':cut,'at':cut/rate,'seconds':.68,'samples':round(.68*rate),'originalGap':0,'after':before,'before':after,'review':'Adjoining ASR word timestamps reviewed; canonical wording retained.'})
 report['skipped']=[s for s in report['skipped'] if s['recording']!=name]
 edits.sort(key=lambda e:e['sample']);pieces=[];cursor=0;fade=110
 for e in edits:
  cut=e['sample'];piece=pcm[:,cursor:cut].copy()
  if piece.shape[1]>=fade:piece[:,-fade:]*=np.linspace(1,0,fade)
  pieces.extend([piece,np.zeros((2,e['samples']),dtype=np.float32)])
  if cut+fade<pcm.shape[1]:pcm[:,cut:cut+fade]*=np.linspace(0,1,fade)
  cursor=cut
 pieces.append(pcm[:,cursor:]);out=np.concatenate(pieces,axis=1)
 dest=str(Path(source).with_name(name+' - paced.mp3')).replace('\\','/')
 with av.open(str(R/dest),'w') as c:
  stream=c.add_stream('libmp3lame',rate=rate);stream.layout='stereo';stream.bit_rate=160000
  for pos in range(0,out.shape[1],1152):
   frame=av.AudioFrame.from_ndarray(np.ascontiguousarray(out[:,pos:pos+1152]),format='fltp',layout='stereo');frame.sample_rate=rate;frame.pts=pos;frame.time_base=Fraction(1,rate)
   for packet in stream.encode(frame):c.mux(packet)
  for packet in stream.encode(None):c.mux(packet)
 def shifted(t):return None if t is None else round(t+sum(e['seconds'] for e in edits if e['at']<=t),3)
 for scene in [s for s in story['scenes'] if s['audio']['src']==source]:
  scene['audio'].update(src=dest,originalSrc=source,pacingVersion=1)
  for k in ['start','end']:scene['audio'][k]=shifted(scene['audio'].get(k))
  for cue in scene['shots']+scene.get('subtitleCues',[]):
   for k in ['start','end']:
    if k in cue:cue[k]=shifted(cue[k])
 rec.update(src=dest,originalSrc=source,label=rec['label']+' · paced narration')
 report['files'].append({'original':source,'edited':dest,'durationBefore':pcm.shape[1]/rate,'durationAfter':out.shape[1]/rate,'insertions':edits})
 print(name,len(edits),'pauses added;',round(out.shape[1]/rate,2),'seconds',flush=True)
story['version']=3
(R/'src/campaign-story.js').write_text("'use strict';\n(function(root){const story="+json.dumps(story,ensure_ascii=False,indent=2)+";\nif(typeof module!=='undefined'&&module.exports)module.exports=story;root.FractureCampaignStory=story;\n})(typeof globalThis!=='undefined'?globalThis:this);\n",encoding='utf-8',newline='\r\n')
(R/'docs/campaign-narration-pacing.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('Uncertain boundaries left unchanged:',len(report['skipped']))
