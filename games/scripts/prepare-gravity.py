"""Reproduce the frozen, filtered GloVe vocabulary. Source model stays outside the repo."""
from pathlib import Path
import gzip,json,hashlib,array,math,sys
root=Path(__file__).resolve().parents[2]
source=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/fox-glove-50.gz')
assert hashlib.md5(source.read_bytes()).hexdigest()=='c289bc5d7f2f02c6dc9f2f9b67641813','Unexpected model archive'
allowed=set(json.loads((root/'wordbridge/data/Synonyms.json').read_text())['words'])
exclude=set('sex sexual rape raped porn pornography nude naked kill killed killing murder murderer suicide gun guns weapon weapons nazi cocaine heroin penis vagina breast breasts intercourse prostitute prostitution bastard damn hell bloody ass asses shit fuck fucking slut whore drug drugs weed marijuana'.split())
target_groups={
 'Nature':'volcano glacier forest desert ocean island river mountain waterfall canyon meadow jungle beach valley cave',
 'Animals':'elephant dolphin penguin butterfly rabbit turtle giraffe leopard kangaroo squirrel eagle owl salmon shark whale',
 'Food':'bread cheese apple banana carrot potato tomato mushroom chocolate coffee honey lemon orange pepper onion',
 'Everyday objects':'bicycle umbrella guitar violin piano camera telescope microscope kettle candle pillow blanket ladder scissors hammer',
 'Places':'library museum hospital airport bakery theatre stadium restaurant classroom playground kitchen bedroom garden harbour village',
 'Weather':'rainbow thunder lightning hurricane tornado blizzard drizzle sunlight snowflake breeze drought rainfall frost monsoon',
 'Skills and activities':'painting sculpture poetry dancing singing swimming cycling running cooking gardening sewing fishing hiking photography astronomy'}
categories={w:c for c,words in target_groups.items() for w in words.split()}
# These are everyday targets; non-dominant senses remain a documented limitation of general embeddings.
rows=[];frequency={};found=set()
with gzip.open(source,'rt') as f:
 next(f)
 for index,line in enumerate(f):
  fields=line.split();w=fields[0]
  if len(fields)!=51 or not w.isalpha() or not w.isascii() or w in exclude:continue
  if w not in allowed and w not in categories:continue
  if len(rows)<6000 or w in categories:
   if w in found:continue
   v=[float(x) for x in fields[1:]];norm=math.sqrt(sum(x*x for x in v));v=[x/norm for x in v]
   rows.append((w,v));frequency[w]=index;found.add(w)
  if len(found)>=6000 and set(categories)<=found:break
missing=set(categories)-found
assert not missing,missing
rows.sort();words=[w for w,_ in rows];vectors=array.array('f',[x for _,v in rows for x in v]);
if sys.byteorder!='little':vectors.byteswap()
raw=vectors.tobytes();out=root/'games/data';out.mkdir(exist_ok=True)
(out/'gravity-v1.f32').write_bytes(raw)
meta={'version':'fox-common-glove-v1','model':'GloVe-6B-50d-v1','dimensions':50,'words':words,'source':'https://nlp.stanford.edu/projects/glove/','sha256':hashlib.sha256(raw).hexdigest()}
(out/'gravity-v1.json').write_text(json.dumps(meta,separators=(',',':')))
# Freeze target difficulty by close-neighbor density and corpus-frequency prior, not guess limit alone.
index={w:i for i,w in enumerate(words)}
vector_rows=[vectors[i*50:(i+1)*50] for i in range(len(words))]
targets=[]
for w,c in categories.items():
 a=vector_rows[index[w]]
 scores=[sum(x*y for x,y in zip(a,b)) for b in vector_rows]
 order=sorted(range(len(words)),key=lambda i:(-scores[i],words[i]));order.remove(index[w]);order.insert(0,index[w])
 near=sum(s>=.55 for s in scores)-1
 targets.append({'id':'gravity-v1-'+w,'word':w,'category':c,'level':1,'model':meta['model'],'vocabulary':meta['version'],'neighbors':near,'hintRanks':[min(30,len(words)),min(5,len(words))],'estimated':True,'difficultyProxy':math.log1p(frequency[w])/(1+math.log1p(max(0,near)))})
# Exactly 100 targets; exclude the seven with fewest contextual neighbors from the 107 candidate collection.
targets=sorted(targets,key=lambda t:(-t['neighbors'],t['word']))[:100]
targets.sort(key=lambda t:(t['difficultyProxy'],t['word']))
for i,t in enumerate(targets):t['level']=min(5,1+i//20);del t['difficultyProxy']
(root/'games/src/newgames/targets.ts').write_text("import type {GravityTarget} from './types.js';\nexport const gravityTargets:GravityTarget[]="+json.dumps(targets,separators=(',',':'))+';\n')
# Curated policy: common 3–5 letter entries, from the same already-filtered WordNet-derived list.
weave=[w for w in words if 3<=len(w)<=5 and w in allowed and frequency[w]<40000]
for w in 'cat are ten ball area lead lady heart ember above revue trees'.split():
 if w not in weave:weave.append(w)
weave.sort();(root/'games/src/newgames/dictionary.ts').write_text('// Versioned common-word subset; licenses and policy: /games/data/NEW-GAMES-SOURCES.md\nexport const dictionaryVersion="fox-common-wordnet-v1";\nexport const dictionary:string[]='+json.dumps(weave,separators=(',',':'))+';\n')
(out/'gravity-provenance.json').write_text(json.dumps({'modelArchiveMD5':'c289bc5d7f2f02c6dc9f2f9b67641813','normalizedFloat32SHA256':meta['sha256'],'vocabulary':len(words),'dimensions':50,'targets':len(targets),'weaveWords':len(weave),'modifications':'Filtered against existing PG WordNet vocabulary plus explicit everyday target list and exclusions; first 6000 eligible frequency-ordered entries plus targets; L2 normalized and stored little-endian Float32. Targets selected and estimated by neighbor density/frequency, not observed player performance.','modelLicense':'https://opendatacommons.org/licenses/pddl/','source':'https://github.com/RaRe-Technologies/gensim-data/releases/download/glove-wiki-gigaword-50/glove-wiki-gigaword-50.gz'},indent=2))
print(len(words),'words;',len(targets),'targets;',len(weave),'Weave words;',len(raw),'vector bytes')
