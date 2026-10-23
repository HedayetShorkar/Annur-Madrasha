"""Offline structural/asset regression checks. Not a browser rendering test."""
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
import re,base64,hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.assets=[];self.links=[];self.stack=[];self.errors=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag in ['script','img','link']:
   url=a.get('src') or a.get('href','')
   if url and not url.startswith(('http','data:')):self.assets.append(url)
  if tag=='a':self.links.append(a.get('href',''))
  if tag not in ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']:self.stack.append(tag)
 def handle_endtag(self,tag):
  if not self.stack or self.stack[-1]!=tag:self.errors.append((tag,self.stack[-3:]))
  else:self.stack.pop()
p=Page();p.feed((ROOT/'index.html').read_text())
assert not p.errors,p.errors
assert not p.stack,p.stack
assert all(n==1 for n in Counter(p.ids).values()),'Duplicate IDs'
for a in p.assets:assert (ROOT/a).is_file(),a
for link in p.links:
 if link.startswith('#/'):
  assert link in ['#/admission','#/login','#/courses'],link
 elif link.startswith('#'):assert link[1:] in p.ids,link
for id in ['pg-home','pg-adm','pg-courses','pg-login','menu-toggle','theme-toggle','tg','fm','tg2','fq','gcs','reviews']:assert id in p.ids,id
app=(ROOT/'assets/js/app.js').read_text()
for path in re.findall(r'assets/images/[^\'" ]+',app):assert (ROOT/path).is_file(),path
# The original backup's embedded artwork must all survive byte-for-byte.
backup=(ROOT/'original-backup/index.backup-phase1.html').read_text()
original={hashlib.sha256(base64.b64decode(s)).hexdigest() for s in re.findall(r'data:image/webp;base64,([A-Za-z0-9+/=]+)',backup)}
current={hashlib.sha256(f.read_bytes()).hexdigest() for f in (ROOT/'assets/images').glob('*')}
assert original==current,(len(original),len(current))
for file in (ROOT/'assets/js').glob('*.js'):subprocess.run(['node','--check',str(file)],check=True)
print(f'PASS: HTML nesting; {len(p.ids)} unique IDs; {len(p.links)} links; {len(p.assets)} asset references; {len(current)} unchanged original images; all JS syntax.')
