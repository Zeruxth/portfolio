# Rebuilds public/halach-alenu/ from the print PDFs: crops every page to its trim box
# (drops the 3mm bleed), splits spreads into pages, and maps each "לך לעמוד N" to a
# clickable area. Needs PyMuPDF and Pillow:  pip install pymupdf pillow
import fitz, re, json, io
from PIL import Image
SRC='/Users/akiyamin/Library/Mobile Documents/com~apple~CloudDocs/Documents/Projects - ICloud/ספר ב/הגשה/'
OUT='/Users/akiyamin/Documents/Projects/Portfolio/public/halach-alenu/'
H=1400; Q=82
doc=fitz.open(SRC+'הלך עלינו.pdf')
PW,PH=doc[0].trimbox.width, doc[0].trimbox.height
links={}

def render(page, clip):
    z=H/clip.height
    pix=page.get_pixmap(matrix=fitz.Matrix(z,z), clip=clip, alpha=False)
    return Image.frombytes('RGB',(pix.width,pix.height),pix.samples)

def save(im,name):
    im.save(OUT+name,'WEBP',quality=Q,method=6)

def hotspots(page, tb, n_right, n_left):
    words=page.get_text('words')
    for w in words:
        if 'לעמוד' not in w[4]: continue
        Y=w[1]
        line=[x for x in words if abs(x[1]-Y)<4 and abs(x[0]-w[0])<80]
        num=[x for x in line if re.fullmatch(r'\d{1,3}',x[4].strip('↙↘ '))]
        if not num: continue
        to=int(num[0][4].strip('↙↘ '))
        x0=min(x[0] for x in line); x1=max(x[2] for x in line)
        label=[x for x in words if Y-18<x[1]<Y-3 and x[2]>x0-60 and x[0]<x1+60 and not re.fullmatch(r'\d+',x[4])]
        allw=line+label
        r=[min(x[0] for x in allw)-6, min(x[1] for x in allw)-5, max(x[2] for x in allw)+6, max(x[3] for x in allw)+5]
        r=[r[0]-tb.x0, r[1]-tb.y0, r[2]-tb.x0, r[3]-tb.y0]
        # which half: spread right half = n_right, left half = n_left
        if n_left is not None and r[2] <= PW+2: n, ox = n_left, 0
        else: n, ox = n_right, (PW if n_left is not None else 0)
        links.setdefault(n,[]).append({'to':to,'r':[round((r[0]-ox)/PW,4),round(r[1]/PH,4),round((r[2]-r[0])/PW,4),round((r[3]-r[1])/PH,4)]})

for i,p in enumerate(doc):
    tb=p.trimbox
    im=render(p,tb)
    if i==0:
        save(im,'pages/001.webp'); hotspots(p,tb,1,None)
    elif i==doc.page_count-1:
        save(im,'pages/208.webp')
    else:
        r,l=2*i,2*i+1   # RTL: even page on the right, odd page on the left
        w=im.width//2
        save(im.crop((0,0,w,im.height)),f'pages/{l:03d}.webp')
        save(im.crop((im.width-w,0,im.width,im.height)),f'pages/{r:03d}.webp')
        hotspots(p,tb,r,l)
    print(i,end=' ',flush=True)

# endpapers
p=fitz.open(SRC+'פורזץ.pdf')[0]; im=render(p,p.trimbox); w=im.width//2
save(im.crop((0,0,w,im.height)),'endpaper-l.webp'); save(im.crop((im.width-w,0,im.width,im.height)),'endpaper-r.webp')
# cover: fold marks at 411.0 / 430.9 / 490.4 / 510.2pt; trim is the board face
p=fitz.open(SRC+'כריכה.pdf')[0]; t=p.trimbox
for name,x0,x1 in [('cover-front',t.x0,411.02)]:
    save(render(p,fitz.Rect(x0,t.y0,x1,t.y1)),name+'.webp')
json.dump({'pageAspect':PW/PH,'coverAspect':(411.02-t.x0)/t.height,'coverScale':t.height/PH,'links':links},open(OUT+'book.json','w'))
print('\ndone')
