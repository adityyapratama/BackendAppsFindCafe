import json
import shapefile

IN = '/Users/dsi/projects/BackendAppsFindCafe/assets/dataset/restoran_cafe'
OUT = '/Users/dsi/projects/BackendAppsFindCafe/assets/dataset/places.json'

sf = shapefile.Reader(IN)
out = []
skipped = 0
for rec in sf.records():
    name = (rec['Name'] or '').strip()
    if not name or rec['Y'] is None or rec['X'] is None:
        skipped += 1
        continue
    out.append({
        'name': name[:150],
        'latitude': round(float(rec['Y']), 7),
        'longitude': round(float(rec['X']), 7),
        'foto': (rec['Foto'] or '').strip(),
    })
print(f'Skipped {skipped} records with no name or coords')

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False)

print(f'Wrote {len(out)} places -> {OUT}')
