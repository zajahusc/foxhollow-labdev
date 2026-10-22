"""Create source-attributed clues from the same licensed WordNet edition as WordBridge."""
from pathlib import Path
import json,gzip,xml.etree.ElementTree as ET,re,hashlib
root=Path(__file__).resolve().parents[2]
source=Path('/tmp/fox-wordnet-2025.xml.gz')
assert hashlib.sha256(source.read_bytes()).hexdigest()=='9ca6d1dcb75f822fdd66617f7d9da48142ace38dd544d6ad5e2feca1674ad3fe'
allowed=set(json.loads((root/'games/data/gravity-v1.json').read_text())['words'])
entries={};definitions={};synonyms={}
blocked=set('pct inc ltd corp etc aka cpu cpa dna rna hiv gdp gop irs atm mph rpm usd fbi cia nato ftc apb sgt gen col rep dem para govt govt plc ltd ltds ltd coed'.split())
for _,e in ET.iterparse(gzip.open(source),events=['end']):
 if e.tag=='LexicalEntry':
  lemma=e.find('Lemma');w=lemma.get('writtenForm','') if lemma is not None else ''
  if w in allowed and w not in blocked and re.fullmatch('[a-z]{3,7}',w):
   senses=[x.get('synset') for x in e.findall('Sense')];entries.setdefault(w,[]).extend(senses)
   for sense in senses:synonyms.setdefault(sense,[]).append(w)
  e.clear()
 elif e.tag=='Synset':
  d=e.find('Definition')
  if d is not None:definitions[e.get('id')]=' '.join(''.join(d.itertext()).split())
  e.clear()
lexicon={}
for w,senses in sorted(entries.items()):
 for sense in senses:
  text=definitions.get(sense,'').split(';')[0].strip()
  if not 12<=len(text)<=170 or re.search(r'\b'+re.escape(w)+r'(?:s|ed|ing)?\b',text,re.I) or re.search(r'offensive|vulgar|derogatory|slur|sexual|genital|nazi|abbreviation|initialism|acronym|short for',text,re.I):continue
  lexicon[w]={'text':text[:1].upper()+text[1:],'accepted':sorted(set(x for x in synonyms.get(sense,[]) if len(x)==len(w))),'synset':sense}
  break
(root/'games/src/newgames/crossword-lexicon.ts').write_text("// Open English WordNet 2025, CC BY 4.0; see /wordbridge/data/Licenses.txt\nexport const crosswordVersion='fox-crossword-wordnet-v2';\nexport const crosswordLexicon:Record<string,{text:string;accepted:string[];synset:string}>="+json.dumps(lexicon,separators=(',',':'))+';\n')
print(len(lexicon),'source-backed crossword entries')
