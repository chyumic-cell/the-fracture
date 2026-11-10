import sys,time
from pathlib import Path
sys.path.insert(0,'D:/TheFracture/.art-work/voice-tools')
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro
p=Path('D:/TheFracture/.art-work/neural-voices')
opt=ort.SessionOptions();opt.intra_op_num_threads=2;opt.inter_op_num_threads=1
session=ort.InferenceSession(str(p/'kokoro-v1.0.onnx'),sess_options=opt,providers=['CPUExecutionProvider'])
k=Kokoro.from_session(session,str(p/'voices-v1.0.bin'))
for voice,text in [('am_michael','Rifle squad reporting. We have your flank covered. Give us a clear firing lane.'),('bm_george','You have my attention, commander. Let us bring this needless conflict to its conclusion.'),('af_heart','We are under attack. Our forces need your attention.')]:
 t=time.time();a,sr=k.create(text,voice=voice,speed=1.0,lang='en-gb' if voice[0]=='b' else 'en-us');sf.write(p/(voice+'-sample.wav'),a,sr);print(voice,len(a)/sr,round(time.time()-t,1),flush=True)
