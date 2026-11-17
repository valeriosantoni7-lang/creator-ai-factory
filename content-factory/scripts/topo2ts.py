"""Regenerate src/social/swissGeo.ts from the swiss-maps TopoJSON.

Usage: npm pack swiss-maps, extract ch-combined.json (2026 data) next to this script, then
    python3 topo2ts.py && mv swissGeo.ts ../src/social/swissGeo.ts
"""
import json, math
d = json.load(open('ch-combined.json'))
sx, sy = d['transform']['scale']; tx, ty = d['transform']['translate']
arcs = []
for a in d['arcs']:
    x = y = 0; pts = []
    for dx, dy in a:
        x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
    arcs.append(pts)
def arc(i):
    return arcs[i] if i >= 0 else arcs[~i][::-1]
def ring(idx):
    pts = []
    for i in idx:
        p = arc(i)
        pts.extend(p if not pts else p[1:])
    return pts
def rdp(pts, eps):
    if len(pts) < 3: return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1; n = math.hypot(dx, dy) or 1e-12
    dmax, k = 0, 0
    for i in range(1, len(pts) - 1):
        x0, y0 = pts[i]
        dd = abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1) / n
        if dd > dmax: dmax, k = dd, i
    if dmax > eps:
        return rdp(pts[:k + 1], eps)[:-1] + rdp(pts[k:], eps)
    return [pts[0], pts[-1]]
LAT0 = 46.8; COS = math.cos(math.radians(LAT0))
LON_MIN, LAT_MAX = tx, 47.81
K = 1000 / ((10.4922 - LON_MIN) * COS)
def proj(lon, lat): return ((lon - LON_MIN) * COS * K, (LAT_MAX - lat) * K)
def path(geom, eps, minpts=4):
    polys = [geom['arcs']] if geom['type'] == 'Polygon' else geom['arcs']
    out = []
    for poly in polys:
        for r in poly:
            R = ring(r)
            m = max(range(len(R)), key=lambda i: (R[i][0]-R[0][0])**2 + (R[i][1]-R[0][1])**2)
            pts = rdp(R[:m + 1], eps)[:-1] + rdp(R[m:], eps)
            if len(pts) < minpts: continue
            P = [proj(*p) for p in pts]
            out.append('M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in P) + 'Z')
    return ''.join(out)
def centroid(geom):
    polys = [geom['arcs']] if geom['type'] == 'Polygon' else geom['arcs']
    best = max((ring(p[0]) for p in polys), key=len)
    A = cx = cy = 0
    P = [proj(*p) for p in best]
    for (x0, y0), (x1, y1) in zip(P, P[1:] + P[:1]):
        c = x0 * y1 - x1 * y0; A += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
    A /= 2
    return (round(cx / (6 * A), 1), round(cy / (6 * A), 1))
CODES = ['ZH','BE','LU','UR','SZ','OW','NW','GL','ZG','FR','SO','BS','BL','SH','AR','AI','SG','GR','AG','TG','TI','VD','VS','NE','GE','JU']
EPS = 0.0035
country = ''.join(path(g, EPS) for g in d['objects']['country']['geometries'])
cantons = {CODES[g['id'] - 1]: {'d': path(g, EPS, 3), 'c': centroid(g)} for g in d['objects']['cantons']['geometries']}
lakes = [p for p in (path(g, EPS, 5) for g in d['objects']['lakes']['geometries']) if p]
H = (LAT_MAX - ty) * K
ts = f'''// Borders of Switzerland, its cantons and lakes for the animated maps (ReelMappa).
// Source: swiss-maps 4.7.0 (swisstopo / Swiss Federal Statistical Office data, 2026), simplified with
// Douglas-Peucker (~350 m) and projected equirectangular at 46.8° N. Regenerate with scripts/topo2ts.py.
export const GEO_W = 1000;
export const GEO_H = {H:.0f};
const LON_MIN = {LON_MIN};
const LAT_MAX = {LAT_MAX};
const COS = {COS};
const K = {K};
export const project = (lon: number, lat: number): [number, number] => [
  (lon - LON_MIN) * COS * K,
  (LAT_MAX - lat) * K,
];
export const COUNTRY = "{country}";
export const CANTONS: Record<string, {{ d: string; c: [number, number] }}> = {json.dumps(cantons)};
export const LAKES: string[] = {json.dumps(lakes)};
'''
open('swissGeo.ts', 'w').write(ts)
print(len(ts)//1024, 'kB', 'H=', round(H), 'lakes', len(lakes))
