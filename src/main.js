/**
 * COSMIC KUNDALI — main.js
 * Orchestrates: form → compute → render → tabs → Supabase
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  computePlanets, buildHouses, calcDasha,
  getCurrentDasha, getCurrentAntardasha, getNextDasha,
  detectYogas, calcAshtakavarga,
  ZODIAC, ZODIAC_SYM, RULERS, NAKSHATRA, NAK_DEITY,
  signOf, nakOf, nakPada, planetStrength,
  PNAME, DASHA_ORDER,
  fmtDate, fmtYM, calcAge, dayName, abbrev, ordinal, norm360
} from './astro-engine.js';

import { renderChart, buildChartLegend } from './chart.js';

import {
  generateOverview, generateCareer,
  generateLove, generateHealth, generateWealth
} from './content.js';

import { PROKERALA_CONFIG, lookupCity, CITIES } from './config.js';
import { fetchAllFromProkerala, normaliseProkeralaPositions } from './prokerala-api.js';
import { SUPABASE_ENABLED, saveChart } from './supabase.js';

/* ─── STARFIELD ─── */
(function buildStars() {
  const sf = document.getElementById('starfield');
  for (let i = 0; i < 120; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = (Math.random() * 2 + 0.4).toFixed(1);
    s.style.cssText = `width:${sz}px;height:${sz}px;top:${(Math.random()*100).toFixed(1)}%;left:${(Math.random()*100).toFixed(1)}%;--delay:${(Math.random()*8).toFixed(1)}s;--dur:${(Math.random()*4+3).toFixed(1)}s;opacity:${(Math.random()*0.6+0.15).toFixed(2)}`;
    sf.appendChild(s);
  }
})();

/* ─── CITY AUTOCOMPLETE ─── */
(function fillCityList() {
  const dl = document.getElementById('cities-list');
  Object.keys(CITIES).forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.replace(/\b\w/g, l => l.toUpperCase());
    dl.appendChild(opt);
  });
})();

/* ─── API STATUS BADGE ─── */
function setApiStatus(online) {
  const badge = document.getElementById('api-status');
  const txt   = document.getElementById('api-status-text');
  if (!badge || !txt) return;
  badge.className = `api-badge api-badge--${online ? 'online' : 'offline'}`;
  txt.textContent = online ? 'Prokerala API active — Swiss Ephemeris precision' : 'Local engine active';
}
setApiStatus(PROKERALA_CONFIG.ENABLED);

/* ─── SAVE BUTTON VISIBILITY ─── */
document.getElementById('btn-save').classList.toggle('hidden', !SUPABASE_ENABLED);

/* ─── DEFAULT FORM VALUES ─── */
document.getElementById('f-tob').value = '12:00';
document.getElementById('f-dob').max   = new Date().toISOString().split('T')[0];

/* ─── GLOBAL STATE ─── */
let _chartData = null;

/* ─── TOAST ─── */
function showToast(msg, type = '') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = `toast${type ? ' toast-' + type : ''}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/* ─── LOADING OVERLAY ─── */
function setLoading(show) {
  document.getElementById('loading').classList.toggle('show', show);
  const btn = document.getElementById('submit-btn');
  if (btn) btn.disabled = show;
}

/* ─── MAIN GENERATE FUNCTION ─── */
async function generate(formValues) {
  const { name, gender, dob, tob, place, userLat } = formValues;
  const [year, month, day] = dob.split('-').map(Number);
  const [hr, mn]           = tob.split(':').map(Number);
  const dobDate = new Date(year, month - 1, day);

  const loc = lookupCity(place);
  const lat = (userLat !== '' && !isNaN(parseFloat(userLat))) ? parseFloat(userLat) : loc.lat;
  const lng = loc.lng;
  const tz  = loc.tz;

  // Build UTC date for astronomy-engine
  const utHr = hr + mn / 60 - tz;
  const birthUtc = new Date(Date.UTC(year, month - 1, day, Math.floor(utHr), Math.round((utHr % 1) * 60)));

  /* ── Planetary Positions ── */
  let planetsLon = {};
  let details    = {};     // extra precision from Prokerala API
  let apiYogas   = null;

  if (PROKERALA_CONFIG.ENABLED) {
    try {
      const apiResult = await fetchAllFromProkerala(year, month, day, hr, mn, lat, lng, tz);
      if (apiResult.positions) {
        const norm = normaliseProkeralaPositions(apiResult.positions);
        if (norm) { planetsLon = norm.planetsLon; details = norm.details; }
      }
      if (apiResult.yogas?.yogas) apiYogas = apiResult.yogas.yogas;
      setApiStatus(true);
    } catch (err) {
      console.warn('Prokerala API failed, falling back to local engine:', err.message);
      setApiStatus(false);
    }
  }

  // Fallback to local astronomy-engine
  if (Object.keys(planetsLon).length === 0) {
    planetsLon = computePlanets(birthUtc, lat, lng);
  }

  /* ── Houses (Whole Sign) ── */
  const { houseSignNames, planetHouse } = buildHouses(planetsLon.As, planetsLon);

  /* ── Derived Data ── */
  const lagnaIdx  = signOf(planetsLon.As);
  const moonIdx   = signOf(planetsLon.Mo);
  const sunIdx    = signOf(planetsLon.Su);
  const lagnaSign = ZODIAC[lagnaIdx];
  const moonSign  = ZODIAC[moonIdx];
  const sunSign   = ZODIAC[sunIdx];
  const lagnaRuler= RULERS[lagnaIdx];

  const moonNakIdx = nakOf(planetsLon.Mo);
  const moonNak    = NAKSHATRA[moonNakIdx];
  const moonNakDeity = NAK_DEITY[moonNakIdx] || '';
  const moonNakPada  = nakPada(planetsLon.Mo);

  const lagnaNakIdx = nakOf(planetsLon.As);
  const lagnaNak    = NAKSHATRA[lagnaNakIdx];

  /* ── Vimshottari Dasha ── */
  const dashas        = calcDasha(planetsLon.Mo, dobDate);
  const currentDasha  = getCurrentDasha(dashas);
  const currentAD     = getCurrentAntardasha(currentDasha);
  const nextDasha     = getNextDasha(dashas);

  /* ── Yogas ── */
  const localYogas = detectYogas(planetsLon, planetHouse, houseSignNames);
  const yogas = apiYogas
    ? apiYogas.map(y => ({ name: y.name, desc: y.description || y.result }))
    : localYogas;

  /* ── Ashtakavarga ── */
  const avargaScores = calcAshtakavarga(planetsLon, planetHouse);

  /* ── Assemble Data Object ── */
  _chartData = {
    name, gender, dob, tob, place,
    lat, lng, tz,
    planetsLon, details,
    lagnaSign, moonSign, sunSign, lagnaRuler,
    moonNak, moonNakDeity, moonNakPada,
    lagnaNak,
    houseSignNames, planetHouse,
    dashas, currentDasha, currentAD, nextDasha,
    yogas, avargaScores,
  };

  /* ── Render Chart ── */
  const svg = document.getElementById('kundali-svg');
  renderChart(svg, houseSignNames, planetHouse, planetsLon, details);
  buildChartLegend(document.getElementById('chart-legend-wrap'));

  /* ── Ashtakavarga Grid ── */
  renderAvarga(avargaScores);

  /* ── Header ── */
  document.getElementById('r-name').textContent = `${name}'s Kundali, Decoded`;
  document.getElementById('r-bio').textContent  =
    `${gender} · born ${dayName(dobDate)}, ${dobDate.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })} · ${tob} · ${place}`;

  /* Badges */
  const moonStrength = planetStrength('Mo', planetsLon.Mo);
  const badges = [
    `${ZODIAC_SYM[sunIdx]} Sun in ${sunSign}`,
    `Moon in ${moonSign} · ${moonNak}${moonStrength ? ' (' + moonStrength + ')' : ''}`,
    `↑ ${lagnaSign} Lagna · ${lagnaNak}`,
  ];
  document.getElementById('r-badges').innerHTML =
    badges.map(b => `<div class="ck-badge">${b}</div>`).join('');

  /* Facts */
  const facts = [];
  if (currentDasha) facts.push(`<span>Mahadasha: <b>${PNAME[currentDasha.planet]}</b></span>`);
  if (currentAD)    facts.push(`<span>Antardasha: <b>${PNAME[currentAD.planet]}</b> until ${fmtYM(currentAD.end)}</span>`);
  facts.push(`<span>Age: <b>${calcAge(dobDate)}</b></span>`);
  document.getElementById('r-facts').innerHTML = facts.join('');

  /* ── Default Tab ── */
  renderTab('overview');
}

/* ─── ASHTAKAVARGA GRID ─── */
function renderAvarga(scores) {
  const wrap = document.getElementById('avarga-wrap');
  const grid = document.getElementById('avarga-grid');
  if (!wrap || !grid) return;

  grid.innerHTML = '';
  for (let h = 1; h <= 12; h++) {
    const score = scores[h] || 0;
    const cell  = document.createElement('div');
    cell.className = `avarga-cell${score >= 5 ? ' strong' : score <= 2 ? ' weak' : ''}`;
    cell.innerHTML = `<div class="avarga-cell-h">H${h}</div><div class="avarga-cell-n">${score}</div>`;
    cell.title = `House ${h} — ${score}/8 benefic points`;
    grid.appendChild(cell);
  }
  wrap.style.display = 'block';
}

/* ─── TAB RENDERER ─── */
const TAB_GENERATORS = {
  overview: generateOverview,
  career:   generateCareer,
  love:     generateLove,
  health:   generateHealth,
  wealth:   generateWealth,
};

function renderTab(id) {
  const data = _chartData;
  if (!data) return;
  const generator = TAB_GENERATORS[id] || generateOverview;
  document.getElementById('tab-content').innerHTML = generator(data);
}

/* ─── TAB NAVIGATION ─── */
document.getElementById('tab-nav').addEventListener('click', e => {
  const btn = e.target.closest('.ck-tab');
  if (!btn) return;
  document.querySelectorAll('.ck-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  renderTab(btn.dataset.tab);
  document.getElementById('tab-content').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

/* ─── FORM SUBMIT ─── */
document.getElementById('kundali-form').addEventListener('submit', async e => {
  e.preventDefault();
  const errEl = document.getElementById('form-error');
  errEl.textContent = '';

  const name    = document.getElementById('f-name').value.trim();
  const gender  = document.getElementById('f-gender').value;
  const dob     = document.getElementById('f-dob').value;
  const tob     = document.getElementById('f-tob').value;
  const place   = document.getElementById('f-place').value.trim();
  const userLat = document.getElementById('f-lat').value.trim();

  if (!name)  { errEl.textContent = 'Please enter your name.'; return; }
  if (!dob)   { errEl.textContent = 'Please select your date of birth.'; return; }
  if (!tob)   { errEl.textContent = 'Please enter your time of birth.'; return; }
  if (!place) { errEl.textContent = 'Please enter your place of birth.'; return; }

  setLoading(true);

  try {
    await generate({ name, gender, dob, tob, place, userLat });
    document.getElementById('screen-form').style.display   = 'none';
    document.getElementById('screen-result').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error('Generation error:', err);
    errEl.textContent = 'Could not generate chart. Please check your inputs and try again.';
  } finally {
    setLoading(false);
  }
});

/* ─── BACK BUTTON ─── */
document.getElementById('btn-back').addEventListener('click', () => {
  document.getElementById('screen-result').style.display = 'none';
  document.getElementById('screen-form').style.display   = 'flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ─── SAVE TO SUPABASE ─── */
document.getElementById('btn-save').addEventListener('click', async () => {
  if (!_chartData) return;
  if (!SUPABASE_ENABLED) {
    showToast('Supabase not configured — add your credentials to .env', 'error');
    return;
  }
  try {
    await saveChart(_chartData);
    showToast('Chart saved successfully ✦', 'success');
  } catch (err) {
    console.error('Save error:', err);
    showToast('Save failed: ' + err.message, 'error');
  }
});
