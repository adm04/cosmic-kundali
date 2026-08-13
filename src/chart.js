/**
 * COSMIC KUNDALI — SVG Chart Renderer
 * Renders North-Indian style Kundali chart with planet placements
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  ZODIAC, PNAME, NAKSHATRA, nakOf, nakPada, signOf, degInSign, planetStrength
} from './astro-engine.js';

/* ─── CHART GEOMETRY (North Indian) ─── */
const NS = 'http://www.w3.org/2000/svg';
const VIEWBOX = 400;

const HOUSE_POLY = {
  1:  '200,0 300,100 200,200 100,100',
  2:  '0,0 200,0 100,100',
  3:  '0,0 100,100 0,200',
  4:  '0,200 100,100 200,200 100,300',
  5:  '0,200 100,300 0,400',
  6:  '0,400 100,300 200,400',
  7:  '200,400 100,300 200,200 300,300',
  8:  '200,400 300,300 400,400',
  9:  '400,400 300,300 400,200',
  10: '400,200 300,300 200,200 300,100',
  11: '400,200 300,100 400,0',
  12: '400,0 300,100 200,0',
};

const HOUSE_LABEL_POS = {
  1: [200,30], 2: [95,22],  3: [22,95],  4: [100,205],
  5: [22,305], 6: [100,378],7: [200,370],8: [305,378],
  9: [378,305],10:[300,205],11:[378,95], 12:[305,22],
};

const HOUSE_CONTENT_POS = {
  1: [200,90], 2: [100,40],  3: [40,100],  4: [100,200],
  5: [40,300], 6: [100,355], 7: [200,310], 8: [300,355],
  9: [355,300],10:[300,200], 11:[355,100], 12:[300,40],
};

// Planet display order within house
const PLANET_ORDER = ['As','Su','Mo','Ma','Me','Ve','Ju','Sa','Ra','Ke'];

/** Planet colour by strength */
function planetColor(p, planetsLon) {
  const lon = planetsLon[p];
  if (lon === undefined) return 'var(--parchment)';
  const str = planetStrength(p, lon);
  if (str === 'exalted')     return '#b8f5c0';  // green
  if (str === 'own')         return '#a8d8f0';  // blue
  if (str === 'debilitated') return '#f5b8b8';  // red
  return 'var(--parchment)';
}

/** Create SVG element */
function el(tag, attrs = {}, text) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Main chart render function */
export function renderChart(svgEl, houseSignNames, planetHouse, planetsLon, details = {}) {
  // Clear previous dynamic content (keep defs)
  while (svgEl.children.length > 1) svgEl.removeChild(svgEl.lastChild);

  // Background
  svgEl.appendChild(el('rect', {
    x: 1, y: 1, width: 398, height: 398,
    fill: '#150f2b', stroke: 'url(#ckGold)', 'stroke-width': 2
  }));

  // Group planets by house
  const hPlanets = {};
  PLANET_ORDER.forEach(p => {
    const h = planetHouse[p];
    if (h) {
      if (!hPlanets[h]) hPlanets[h] = [];
      hPlanets[h].push(p);
    }
  });

  // Draw house polygons
  for (let h = 1; h <= 12; h++) {
    const hasplanets = hPlanets[h]?.length > 0;
    svgEl.appendChild(el('polygon', {
      points: HOUSE_POLY[h],
      fill: hasplanets ? 'rgba(201,162,75,0.07)' : 'transparent',
      stroke: 'rgba(201,162,75,0.55)',
      'stroke-width': 1,
    }));
  }

  // Draw house numbers and signs
  for (let h = 1; h <= 12; h++) {
    const [lx, ly] = HOUSE_LABEL_POS[h];
    const dy = (h === 1 || h === 7) ? 14 : (h === 4 || h === 10) ? 0 : 12;

    svgEl.appendChild(el('text', {
      x: lx, y: ly, 'text-anchor': 'middle', class: 'ck-house-num'
    }, String(h)));

    svgEl.appendChild(el('text', {
      x: lx, y: ly + dy, 'text-anchor': 'middle', class: 'ck-house-sign'
    }, houseSignNames[h]));
  }

  // Draw planets
  for (let h = 1; h <= 12; h++) {
    if (!hPlanets[h] || hPlanets[h].length === 0) continue;

    const ps = hPlanets[h];
    const [cx, cy] = HOUSE_CONTENT_POS[h];
    const perRow = ps.length > 3 ? 3 : ps.length;

    ps.forEach((p, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const rowCount = Math.ceil(ps.length / perRow);
      const px = cx + (col - (perRow - 1) / 2) * 36;
      const py = cy + (row - (rowCount - 1) / 2) * 24;
      const isAsc = p === 'As';
      const color = isAsc ? 'var(--gold-bright)' : planetColor(p, planetsLon);

      // Degree label from API details or computed
      let degLabel = '';
      if (details[p]) {
        degLabel = `${details[p].degree || 0}°${details[p].minute ? details[p].minute + "'" : ''}`;
      } else if (planetsLon[p] !== undefined) {
        const dg = degInSign(planetsLon[p]);
        degLabel = `${Math.floor(dg)}°${Math.round((dg % 1) * 60)}'`;
      }

      // Retrograde marker
      const isRetro = details[p]?.isRetrograde;

      const g = el('g', isAsc ? { filter: 'url(#ckGlow)' } : {});

      // Planet abbreviation
      const txt = el('text', {
        x: px, y: py,
        'text-anchor': 'middle',
        class: 'ck-planet',
        fill: color,
        'font-style': isRetro ? 'italic' : 'normal',
      }, p + (isRetro ? 'ʀ' : ''));
      g.appendChild(txt);

      // Degree below
      if (degLabel) {
        g.appendChild(el('text', {
          x: px, y: py + 11,
          'text-anchor': 'middle',
          class: 'ck-planet-deg',
        }, degLabel));
      }

      svgEl.appendChild(g);
    });
  }
}

/** Render the Navamsa (D9) chart — same structure, different house assignments */
export function renderNavamsaChart(svgEl, planetsLon) {
  const navamsaHouse = {};
  const NAVAMSA_CYCLE = [0, 3, 6, 9]; // Aries, Cancer, Libra, Capricorn start

  for (const [p, lon] of Object.entries(planetsLon)) {
    const sign = signOf(lon);
    const pada = Math.floor((lon % 30) / (30 / 9)); // 0-8 navamsa within sign
    const startSignCycle = [0, 9, 6, 3][sign % 4]; // fiery=Aries, earthy=Cap, airy=Lib, watery=Cancer
    const starts = [0, 9, 6, 3]; // Aries, Cap, Lib, Cancer
    const navSign = (starts[sign % 4] + pada) % 12;
    navamsaHouse[p] = navSign + 1; // 1-indexed
  }

  const houseSignNames = {};
  for (let h = 1; h <= 12; h++) houseSignNames[h] = ZODIAC[(h - 1) % 12];

  renderChart(svgEl, houseSignNames, navamsaHouse, planetsLon);
}

/** Build color legend for exaltation/debilitation */
export function buildChartLegend(containerEl) {
  containerEl.innerHTML = `
    <div class="ck-chart-legend">
      <span><b>As</b> Ascendant</span>
      <span><b>Su</b> Sun</span><span><b>Mo</b> Moon</span>
      <span><b>Ma</b> Mars</span><span><b>Me</b> Mercury</span>
      <span><b>Ve</b> Venus</span><span><b>Ju</b> Jupiter</span>
      <span><b>Sa</b> Saturn</span><span><b>Ra</b> Rahu</span>
      <span><b>Ke</b> Ketu</span>
    </div>
    <div class="ck-chart-key">
      <span class="key-exalt">■ Exalted</span>
      <span class="key-own">■ Own Sign</span>
      <span class="key-debil">■ Debilitated</span>
      <span class="key-retro">ʀ Retrograde</span>
    </div>
  `;
}
