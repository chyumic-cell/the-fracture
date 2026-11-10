import sys,os,json,hashlib,time,shutil
from pathlib import Path
sys.path.insert(0,'D:/TheFracture/.art-work/voice-tools')
import numpy as np,soundfile as sf,onnxruntime as ort
from scipy import signal
from kokoro_onnx import Kokoro
root=Path('D:/TheFracture');model=root/'.art-work/neural-voices';cache=model/'cache';cache.mkdir(exist_ok=True)
worker=int(sys.argv[1]);total=int(sys.argv[2]);opts=ort.SessionOptions();opts.intra_op_num_threads=2;opts.inter_op_num_threads=1
session=ort.InferenceSession(str(model/'kokoro-v1.0.onnx'),sess_options=opts,providers=['CPUExecutionProvider']);synth=Kokoro.from_session(session,str(model/'voices-v1.0.bin'));sr=24000
plan=json.loads((root/'.art-work/neural-voice-plan.json').read_text());plan=[r for r in plan if len(sys.argv)<4 or '/commander/' in r['path'] or '/symbiotes_u0/select/' in r['path']];done={};started=time.time();count=0

def eq(a,f,kind='lowpass',q=2):
 sos=signal.butter(q,f,btype=kind,fs=sr,output='sos');return signal.sosfilt(sos,a)
def nonverbal(kind,variant,category):
 rng=np.random.default_rng(int(hashlib.sha256((kind+str(variant)+category).encode()).hexdigest()[:8],16));dur=.55+variant*.085+(category=='annoy')*.25;t=np.arange(int(sr*dur))/sr;env=np.sin(np.pi*t/dur)**1.3
 if kind.startswith('chitter'):
  f=1800 if 'light' in kind else 600 if 'heavy' in kind else 1100;pulse=(np.sin(2*np.pi*(17+variant*3)*t)>.4).astype(float);a=eq(rng.normal(0,1,len(t)),[f,f+2200],'bandpass')*pulse*.25+np.sin(2*np.pi*(f*.37)*t)*pulse*.035
 elif kind in ('servo','sentinel'):
  a=np.sin(2*np.pi*(210+variant*29)*t+3*np.sin(t*23))*np.sin(np.pi*t/dur)**2*.14;a+=eq(rng.normal(0,.1,len(t)),[1700,4500],'bandpass')*(np.sin(t*105)>0.97);a+=np.sin(2*np.pi*(620+120*np.sin(t*4))*t)*.03
 else:
  freq={'ape_hoot':290,'ape_bark':190,'ape_rumble':65,'ape_grunt':102,'hound':75,'roar':52,'reptile':95,'undead':85,'stone':48,'animal':240}.get(kind,95)*(1+(variant-2)*.045);f0=freq*(1+.12*np.sin(t*8)+.04*np.sin(t*57));phase=2*np.pi*np.cumsum(f0)/sr;source=sum(np.sin(phase*k)/k for k in range(1,11));a=eq(source,1200)*.13+eq(rng.normal(0,.18,len(t)),[180,1800],'bandpass')*.4
  if kind.startswith('ape'):a*=.35+.65*(np.sin(t*(14 if kind=='ape_bark' else 7))**2);a+=eq(source,[500,900],'bandpass')*.11
  if kind in ('reptile','roar'):a+=eq(rng.normal(0,.15,len(t)),[2600,6500],'bandpass')*.3
  if kind=='stone':a=eq(rng.normal(0,.5,len(t)),[110,1400],'bandpass')*(.4+.6*np.sin(t*45)**6)
 a*=env;return np.r_[np.zeros(120),a,np.zeros(500)]
def process(a,style):
 a=np.asarray(a,dtype=np.float64);a=eq(a,65,'highpass')
 if style=='radio':a=eq(eq(a,200,'highpass'),4500);a=np.tanh(a*1.3)/1.3
 if style=='machine':a=eq(a,4200)*(.82+.18*np.sin(2*np.pi*70*np.arange(len(a))/sr));a+=np.r_[np.zeros(220),a[:-220]]*.12
 if style in ('reptile','insect'):a+=eq(a,[2700,7500],'bandpass')*.65
 if style in ('gravel','orc','wolf','dry','demon','demon_lord','dragon','giant','primate'):
  t=np.arange(len(a))/sr;a=a*(.94+.06*np.sin(2*np.pi*43*t));a+=eq(a,400)*.38
  rate={'dragon':.84,'giant':.88,'demon_lord':.88,'primate':.94,'wolf':.94}.get(style,.98);a=signal.resample_poly(a,100,round(rate*100))
 if style=='goblin':a=eq(a,180,'highpass');a=signal.resample_poly(a,100,108)
 if style=='ethereal':a+=np.r_[np.zeros(900),a[:-900]]*.12
 peak=np.max(np.abs(a)) or 1;a=a/peak*.72;ends=min(240,len(a)//10);a[:ends]*=np.linspace(0,1,ends);a[-ends:]*=np.linspace(1,0,ends)
 return np.asarray(a,dtype=np.float32)
for row in plan:
 key=row['key']
 if int(key[:8],16)%total!=worker:continue
 dest=root/row['path'];dest.parent.mkdir(parents=True,exist_ok=True);pr=row['profile'];voices=['am_michael','af_heart','bm_george','af_bella','bm_fable'] if pr['voice']=='collective' else [pr['voice']]
 for layer,voice in enumerate(voices):
  target=dest.with_name(dest.stem+'-layer'+str(layer)+'.ogg') if len(voices)>1 else dest;cached=cache/(key+('-'+str(layer) if len(voices)>1 else '')+'.ogg')
  if not cached.exists():
   if pr.get('nonverbal'):a=nonverbal(pr['nonverbal'],row['variant'],dest.parent.name)
   else:a,rate=synth.create(row['text'],voice=voice,speed=pr['speed'],lang='en-gb' if voice[0]=='b' else 'en-us')
   a=process(a,pr['style']);sf.write(cached,a,sr,format='OGG',subtype='VORBIS');count+=1
   if count%20==0:print(json.dumps({'worker':worker,'rendered':count,'seconds':round(time.time()-started),'file':str(target.relative_to(root))}),flush=True)
  if not target.exists() or target.read_bytes()!=cached.read_bytes():shutil.copyfile(cached,target)
print('COMPLETE worker '+str(worker)+' rendered '+str(count),flush=True)
