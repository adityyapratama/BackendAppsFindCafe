require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '..', 'assets', 'dataset');
const SRC = path.join(DATA_DIR, 'places.json');
const OUT = path.join(DATA_DIR, 'places_geocoded.json');

const CONCURRENCY = 20;
const RETRIES = 3;
const SAVE_EVERY = 200;
const UA = 'cafesurabaya-migration/1.0 admin@cafesurabaya.com';

function get(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, body: d, retryAfter: res.headers['retry-after'] }));
    });
    req.on('error', () => resolve({ status: 0, body: '' }));
    req.setTimeout(15000, () => req.destroy(new Error('timeout')));
  });
}

function buildAddress(j) {
  if (!j) return null;
  const kelArr = (j.localityInfo && j.localityInfo.administrative) || [];
  let kelurahan = null;
  for (const a of kelArr) {
    if (a.name && a.adminLevel >= 6) kelurahan = a.name;
  }
  const kecamatan = j.locality || null;
  const city = j.city || null;
  const postcode = j.postcode || null;
  const parts = [];
  if (kelurahan && kelurahan !== kecamatan) parts.push(kelurahan);
  if (kecamatan) parts.push(kecamatan);
  if (city) parts.push(city);
  if (postcode) parts.push(postcode);
  return parts.length ? parts.join(', ') : null;
}

async function geocodeOne(lat, lng) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=id`;
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    const r = await get(url);
    if (r.status === 200 && r.body) {
      try {
        return buildAddress(JSON.parse(r.body));
      } catch {
        return null;
      }
    }
    if (r.status === 429 || r.status >= 500 || r.status === 0) {
      await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
      continue;
    }
    return null;
  }
  return null;
}

async function runPool(items, worker, concurrency) {
  let idx = 0;
  let done = 0;
  const total = items.length;
  async function spawn() {
    while (idx < total) {
      const i = idx++;
      await worker(i);
      done++;
      if (done % SAVE_EVERY === 0) {
        console.log(`progress ${done}/${total} (${Math.round((done / total) * 100)}%)`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, spawn));
}

async function main() {
  const places = JSON.parse(fs.readFileSync(SRC, 'utf-8'));
  let results;
  if (fs.existsSync(OUT)) {
    results = JSON.parse(fs.readFileSync(OUT, 'utf-8'));
    if (results.length !== places.length) results = new Array(places.length).fill(null);
  } else {
    results = new Array(places.length).fill(null);
  }

  const pending = [];
  for (let i = 0; i < places.length; i++) {
    if (results[i] === null) pending.push(i);
  }
  console.log(`Total ${places.length}, already done ${places.length - pending.length}, pending ${pending.length}`);

  let dirty = false;
  let lastSave = Date.now();
  await runPool(
    pending,
    async (pos) => {
      const p = places[pos];
      const addr = await geocodeOne(p.latitude, p.longitude);
      results[pos] = addr || '';
      dirty = true;
      if (dirty && (pos % SAVE_EVERY === 0 || Date.now() - lastSave > 15000)) {
        fs.writeFileSync(OUT, JSON.stringify(results));
        dirty = false;
        lastSave = Date.now();
      }
    },
    CONCURRENCY
  );

  fs.writeFileSync(OUT, JSON.stringify(results));
  const filled = results.filter((r) => r && r.length).length;
  const empty = results.filter((r) => !r || !r.length).length;
  console.log(`Geocoded ${filled} with address, ${empty} empty/failed. Saved -> ${OUT}`);
}

main().catch((e) => {
  console.error('Geocode error:', e);
  process.exit(1);
});
