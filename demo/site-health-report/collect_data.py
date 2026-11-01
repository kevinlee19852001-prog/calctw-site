"""Sequential GET of sitemap pages only; no crawling or subresource requests."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, unquote
import urllib.request, urllib.error, xml.etree.ElementTree as ET
import json, time, subprocess, datetime
ROOT = Path(__file__).resolve().parents[2]
class Parser(HTMLParser):
    def __init__(self):
        super().__init__(); self.title=''; self.description=''; self.viewport=''; self.links=[]; self.in_title=False
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='title': self.in_title=True
        if tag=='meta':
            if a.get('name','').lower()=='description': self.description=a.get('content','')
            if a.get('name','').lower()=='viewport': self.viewport=a.get('content','')
        if tag=='a' and a.get('href'): self.links.append(a['href'])
    def handle_endtag(self,tag):
        if tag=='title': self.in_title=False
    def handle_data(self,data):
        if self.in_title: self.title+=data
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs): return None
urls=[e.text.strip() for e in ET.parse(ROOT/'sitemap.xml').iter() if e.tag.endswith('loc')]
opener=urllib.request.build_opener(NoRedirect)
rows=[]
for i,url in enumerate(urls):
    if i: time.sleep(1)
    row={'url':url,'path':urlsplit(url).path,'status':0,'bytes':None,'error':None}
    p=Parser()
    try:
        with opener.open(urllib.request.Request(url,headers={'User-Agent':'SiteHealthSample/1.0'}),timeout=20) as r:
            body=r.read(); row.update(status=r.status,bytes=len(body)); p.feed(body.decode('utf-8','replace'))
    except urllib.error.HTTPError as e: row.update(status=e.code,error=str(e.reason))
    except Exception as e: row['error']=str(e)
    row.update(title=p.title.strip(),title_length=len(p.title.strip()),description=p.description,description_length=len(p.description),viewport=p.viewport,internal_links=[])
    for href in p.links:
        target=urlsplit(urljoin(url,href))
        if target.netloc==urlsplit(url).netloc and target.scheme in ('http','https'):
            path=unquote(target.path or '/'); f=ROOT/path.lstrip('/')
            if path.endswith('/'): f=f/'index.html'
            row['internal_links'].append({'path':path,'local_exists':f.is_file(),'http_status':None})
    rows.append(row)
    print(row['path'],row['status'],flush=True)
status={r['path']:r['status'] for r in rows}
for r in rows:
    for link in r['internal_links']:
        link['http_status']=status.get(link['path'])
audit=subprocess.run(['python3','/home/box/codex-work/audit.py','--local','--repo',str(ROOT),'--json'],capture_output=True,text=True)
data={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':{'requests':'GET only, sitemap URLs only, sequential, 1 second delay, no redirect following','bytes':'HTML response bytes, not total transfer size','links':'HTTP statuses for sitemap targets; local existence for other internal paths; fragments not checked','thresholds':{'title':[10,60],'description':[40,160],'html_bytes_warning':200000}},'local_audit':json.loads(audit.stdout),'pages':rows}
Path(__file__).with_name('data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
# Local evidence is explicitly separate from unavailable live measurements.
for row in data['pages']:
    f=ROOT/row['path'].lstrip('/')/'index.html'
    p=Parser(); raw=f.read_bytes(); p.feed(raw.decode('utf-8','replace'))
    links=[]
    for href in p.links:
        target=urlsplit(urljoin(row['url'],href))
        if target.netloc==urlsplit(row['url']).netloc and target.scheme in ('http','https'):
            path=unquote(target.path or '/'); dest=ROOT/path.lstrip('/')
            if path.endswith('/'): dest=dest/'index.html'
            links.append({'path':path,'local_exists':dest.is_file(),'http_status':status.get(path)})
    row['local']={'title':p.title.strip(),'title_length':len(p.title.strip()),'description':p.description,'description_length':len(p.description),'viewport':p.viewport,'bytes':len(raw),'internal_links':links}
Path(__file__).with_name('data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
