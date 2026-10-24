# Rebuilds the outlined titles of public/index-gallery/ as stroked paths that can
# draw themselves. Figma's SVG export (exports/index-gallery/*.export.svg) draws
# each "outside" stroke as a filled shape masked by the glyph outline, and clips
# it at the slide edge. The glyph outline in each mask is whole, so this keeps
# only that, splits it into contours and gives every contour a draw delay in
# reading order: English left to right, Hebrew and Arabic right to left.
import re

SRC = 'exports/index-gallery/'
OUT = 'public/index-gallery/svg/'

# per title: one entry per text line group, in export order
# (reading direction, Figma stroke weight, font size)
TITLES = {
    'home':       [('ltr', 2, 349), ('rtl', 2, 349), ('rtl', 2, 379)],
    'exhibition': [('ltr', 0.985, 213), ('rtl', 0.985, 213), ('rtl', 0.875, 205)],
    'about':      [('ltr', 2.047, 442), ('rtl', 2.047, 442), ('rtl', 1.817, 426)],
    'archive':    [('ltr', 1.338, 289), ('rtl', 1.338, 289), ('rtl', 0.978, 229)],
}
SPREAD = 0.75   # seconds between the first and last contour of a line group
STAGGER = 0.12  # seconds between line groups

TOKEN = re.compile(r'[MLCHVZ]|-?\d*\.?\d+(?:e-?\d+)?')


def contours(d):
    """Split absolute path data into subpaths, with each one's bounding box."""
    out, cur, pts, x, y = [], [], [], 0.0, 0.0
    toks = TOKEN.findall(d)
    i, cmd = 0, None
    while i < len(toks):
        t = toks[i]
        if t in 'MLCHVZ':
            cmd = t; i += 1
            if cmd == 'M' and cur:
                out.append((''.join(cur), pts)); cur, pts = [], []
            if cmd == 'Z':
                cur.append('Z')
            continue
        n = {'M': 2, 'L': 2, 'C': 6, 'H': 1, 'V': 1}[cmd]
        vals = [float(v) for v in toks[i:i + n]]
        i += n
        if cmd == 'H': x = vals[0]
        elif cmd == 'V': y = vals[0]
        else:
            x, y = vals[-2], vals[-1]
            pts += [(vals[k], vals[k + 1]) for k in range(0, n, 2)]
        pts.append((x, y))
        cur.append(cmd + ' '.join(f'{v:g}' for v in vals))
        if cmd == 'M': cmd = 'L'  # implicit lineto after a moveto
    if cur: out.append((''.join(cur), pts))
    return out


def order(cs, direction, size):
    """Sort contours into reading order: by line, then along the line."""
    boxes = []
    for d, pts in cs:
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        boxes.append((d, (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2))
    boxes.sort(key=lambda b: b[2])
    lines, last = [], None
    for b in boxes:
        if last is None or b[2] - last > size * 0.5: lines.append([])
        lines[-1].append(b); last = b[2]
    flat = []
    for ln in lines:
        flat += sorted(ln, key=lambda b: b[1], reverse=(direction == 'rtl'))
    return [b[0] for b in flat]


for name, groups in TITLES.items():
    s = open(f'{SRC}title-{name}.export.svg').read()
    w, h = re.search(r'<svg width="([\d.]+)" height="([\d.]+)"', s).groups()
    masks = re.findall(r'<mask id="[^"]+"[^>]*>\s*<rect[^>]*/>\s*<path d="([^"]+)"', s)
    assert len(masks) == len(groups), (name, len(masks))
    body = []
    for g, (d, (direction, sw, size)) in enumerate(zip(masks, groups)):
        paths = order(contours(d), direction, size)
        n = max(len(paths) - 1, 1)
        # Figma's stroke sits outside the letters: mask out the glyphs themselves,
        # which also hides the seams where a font's contours overlap, and
        # double the width so the half that shows matches Figma's weight
        mid = f'{name}-{g}'
        body.append(f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="-4000" y="-4000" width="10000" height="10000">'
                    f'<rect x="-4000" y="-4000" width="10000" height="10000" fill="white"/>'
                    f'<path d="{d}" fill="black" stroke="none"/></mask>')
        body.append(f'<g stroke-width="{sw * 2:g}" mask="url(#{mid})">')
        for k, p in enumerate(paths):
            delay = g * STAGGER + SPREAD * k / n
            body.append(f'<path pathLength="1" style="--d:{delay:.3f}s" d="{p}"/>')
        body.append('</g>')
    svg = (f'<svg class="title-art" width="{w}" height="{h}" viewBox="0 0 {w} {h}" '
           f'overflow="visible" fill="none" stroke="#DDE2EC" xmlns="http://www.w3.org/2000/svg">\n'
           + '\n'.join(body) + '\n</svg>\n')
    open(f'{OUT}title-{name}.svg', 'w').write(svg)
    print(name, sum(b.count('<path') for b in body), 'contours', len(svg) // 1024, 'KB')
