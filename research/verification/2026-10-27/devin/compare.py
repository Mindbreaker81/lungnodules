import json, math, collections
from models import mayo, brock, herder, plcom2012, logistic

import os
OUT = os.environ.get('DEVIN_RECALC_OUT', os.path.dirname(os.path.abspath(__file__))) + '/'
cases = json.load(open(OUT + 'app-results.json'))
plcom = json.load(open(OUT + 'app-results-plcom.json'))

def band(p):
    return 'low' if p < 0.05 else 'intermediate' if p <= 0.65 else 'high'

num_stats = collections.defaultdict(lambda: [0, 0.0, None])
mismatches = []
status_counts = collections.Counter()

for c in cases:
    sm = 1 if c['sm'] in ('current', 'former') else 0
    can = 1 if c['ca'] == 'over5y' else 0
    for s in c['summaries']:
        status_counts[(s['id'], s['status'])] += 1
        if s['status'] != 'available':
            continue
        app = s['probability']
        if s['id'] == 'mayo':
            mine = mayo(c['age'], sm, can, c['d'], int(bool(c.get('spic'))), int(c['up']))
        elif s['id'] == 'brock':
            d = c.get('mx') if c.get('mx') is not None else c['d']
            ntype = {'solid': 'solid', 'part-solid': 'part-solid', 'ground-glass': 'nonsolid'}[c['ty']]
            count = c.get('nc') if c.get('nc') is not None else 1
            if c.get('spic') is None:
                mine = brock('2a', c['age'], c['sex'] == 'female', 1, 0, d, ntype, c['up'], count)
            else:
                mine = brock('2b', c['age'], c['sex'] == 'female', 1, 0, d, ntype, c['up'], count, spic=int(c.get('spic')))
        elif s['id'] == 'herder':
            pre = mayo(c['age'], sm, can, c['d'], int(bool(c.get('spic'))), int(c['up']))
            mine = herder(pre, c.get('pet'))
            if abs(s['preTestProbability'] - pre) > 1e-9:
                mismatches.append(('herder-pretest', c, s['preTestProbability'], pre))
        diff = abs(app - mine)
        st = num_stats[s['id']]
        st[0] += 1
        if diff > st[1]:
            st[1] = diff
            st[2] = c
        if diff > 1e-9:
            mismatches.append((s['id'], c, app, mine))
        if s['riskBand'] != band(app):
            mismatches.append(('band', s['id'], c, app, s['riskBand']))

print("=== status counts ===")
for k, v in sorted(status_counts.items()):
    print(k, v)
print("\n=== numeric comparison (app 'available' vs mine) ===")
for k, (n, mx, wc) in num_stats.items():
    print(f"{k}: n={n} maxdiff={mx:.3e}")
    if mx > 1e-9 and wc: print("   worst:", wc)
print(f"\nTotal mismatches: {len(mismatches)}")
for m in mismatches[:20]:
    print(m)

# PLCOm2012
pmx = 0.0; pbad = []
for c in plcom:
    i = c['input']
    mine = plcom2012(i['age'], i['race'], i['education'], i['bmi'], i['copd'],
                     i['cancer_hist'], i['family_hist_lung_cancer'],
                     i['smoking_status'], i['smoking_intensity'],
                     i['duration_smoking'], i['smoking_quit_time'])
    if abs(c['p'] - mine) > 1e-12:
        pbad.append((c, mine))
    pmx = max(pmx, abs(c['p'] - mine))
print(f"\nPLCOm2012: n={len(plcom)} maxdiff={pmx:.3e} bad={len(pbad)}")
for m in pbad[:10]: print(m)
