/**
 * COSMIC KUNDALI — Astronomy Engine
 * Uses astronomy-engine (NASA/JPL-grade accuracy) for planetary positions
 * Falls back gracefully to mean elements if needed
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  AstroTime,
  SunPosition,
  GeoMoon,
  GeoVector,
  Ecliptic,
  Body,
} from 'astronomy-engine';

/* ─── LAHIRI AYANAMSA (IAU) ─── */
function lahiriAyanamsa(jd) {
  const T = (jd - 2451545.0) / 36525;
  return 23.85 + 0.01360 * T - 0.000003 * T * T;
}

/* ─── PLANET POSITIONS USING astronomy-engine ─── */
export function computePlanets(dateObj, lat, lng) {
  const astroDate = new AstroTime(dateObj);
  const tropical = {};

  // Sun (high precision VSOP87)
  try {
    const sun = SunPosition(astroDate);
    tropical.Su = norm360(sun.elon);
  } catch {
    const T2 = (astroDate.tt - 2451545) / 36525;
    tropical.Su = norm360(280.46646 + 36000.76983 * T2);
  }

  // Moon (arcsecond precision)
  try {
    const moon = GeoMoon(astroDate);
    const moonEcl = Ecliptic(moon);
    tropical.Mo = norm360(moonEcl.elon);
  } catch {
    const T2 = (astroDate.tt - 2451545) / 36525;
    tropical.Mo = norm360(218.3165 + 481267.8813 * T2);
  }

  // Outer planets via GeoVector → Ecliptic
  const planetBodies = {
    Ma: Body.Mars,
    Me: Body.Mercury,
    Ve: Body.Venus,
    Ju: Body.Jupiter,
    Sa: Body.Saturn,
  };

  const T = (astroDate.tt - 2451545.0) / 36525;

  for (const [abbr, body] of Object.entries(planetBodies)) {
    try {
      const vec = GeoVector(body, astroDate, true);
      const ecl = Ecliptic(vec);
      tropical[abbr] = norm360(ecl.elon);
    } catch {
      tropical[abbr] = fallbackMeanLon(abbr, T);
    }
  }

  // Rahu — Mean Lunar Ascending Node (classic formula, very accurate)
  const rahuTrop = norm360(125.0445 - 1934.1363 * T + 0.0020708 * T * T);
  tropical.Ra = rahuTrop;
  tropical.Ke = norm360(rahuTrop + 180);

  // Ascendant
  const ascTrop = computeAscendant(astroDate.tt, lat, lng);

  // Apply Lahiri ayanamsa to convert tropical → sidereal
  const ay = lahiriAyanamsa(astroDate.tt);

  const sidereal = {};
  for (const [p, lon] of Object.entries(tropical)) {
    sidereal[p] = norm360(lon - ay);
  }
  sidereal.As = norm360(ascTrop - ay);

  return sidereal;
}

export const ZODIAC = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
];
export const ZODIAC_SYM = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
export const RULERS = [
  'Mars','Venus','Mercury','Moon','Sun','Mercury',
  'Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'
];

export const NAKSHATRA = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra',
  'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni',
  'Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanistha',
  'Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'
];

export const NAK_LORDS = [
  'Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me',
  'Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me',
  'Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me'
];

export const NAK_DEITY = [
  'Ashwini Kumaras','Yama','Agni','Brahma','Soma','Rudra',
  'Aditi','Brihaspati','Sarpa','Pitrs','Bhaga','Aryaman',
  'Savitar','Vishvakarman','Vayu','Indra-Agni','Mitra','Indra',
  'Nirriti','Apas','Vishvadevas','Vishnu','Ashta Vasus','Varuna',
  'Ajikapada','Ahirbudhnya','Pushan'
];

export const NAK_SYMBOL = [
  'Horse Head','Yoni / Womb','Razor / Flame','Chariot / Ox Cart',
  'Deer Head','Teardrop / Diamond','Bow & Quiver','Flower / Circle',
  'Coiled Serpent','Royal Throne','Swinging Hammock','Fig Tree',
  'Open Hand','Bright Jewel','Coral / Sword','Forked Branch',
  'Lotus / Umbrella','Earring / Talisman','Elephant Goad / Root',
  'Fan / Winnowing Basket','Elephant Tusk','Ear','Drum / Flute',
  'Empty Circle / Thousand Flowers','Sword','Funeral Cot','Fish / Drum'
];

export const DASHA_YRS = { Ke:7, Ve:20, Su:6, Mo:10, Ma:7, Ra:18, Ju:16, Sa:19, Me:17 };
export const DASHA_ORDER = ['Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me'];
export const PNAME = {
  As:'Ascendant', Su:'Sun', Mo:'Moon', Ma:'Mars', Me:'Mercury',
  Ve:'Venus', Ju:'Jupiter', Sa:'Saturn', Ra:'Rahu', Ke:'Ketu'
};

export const DEBIL_SIGN = { Su:6, Mo:9, Ma:3, Me:11, Ve:5, Ju:9, Sa:0 };
export const EXALT_SIGN = { Su:0, Mo:1, Ma:9, Me:5, Ve:11, Ju:3, Sa:6 };
export const OWN_SIGNS = {
  Su:[4], Mo:[3], Ma:[0,7], Me:[2,5], Ve:[1,6], Ju:[8,11], Sa:[9,10]
};



/* ─── ASCENDANT via LMST ─── */
function computeAscendant(jd, lat, lng) {
  const T = (jd - 2451545.0) / 36525;
  const GMST = norm360(280.46061837 + 360.98564736629 * (jd - 2451545) + T * T * 0.000387933);
  const LMST = norm360(GMST + lng);
  const eps = (23.439291111 - 0.013004167 * T) * Math.PI / 180;
  const latR = lat * Math.PI / 180;
  const LMST_r = LMST * Math.PI / 180;
  const y = Math.cos(LMST_r);
  const x = -(Math.sin(eps) * Math.tan(latR) + Math.cos(eps) * Math.sin(LMST_r));
  return norm360(Math.atan2(y, x) * 180 / Math.PI);
}

/* ─── MEAN ELEMENTS FALLBACK ─── */
function fallbackMeanLon(p, T) {
  const mean = {
    Ma: 355.4633 + 19140.2993 * T,
    Me: 252.2509 + 149474.0722 * T,
    Ve: 181.9798 + 58517.8157 * T,
    Ju: 34.3515  + 3034.9057  * T,
    Sa: 50.0774  + 1222.1138  * T,
  };
  return norm360(mean[p] || 0);
}

/* ─── SIGN / NAKSHATRA UTILITIES ─── */
export function signOf(lon) { return Math.floor(lon / 30); }
export function degInSign(lon) { return (lon % 30); }
export function nakOf(lon) { return Math.floor(lon / (360 / 27)); }
export function nakPada(lon) { return Math.floor((lon % (360 / 27)) / (360 / 27 / 4)) + 1; }
export function nakProgress(lon) { return (lon % (360 / 27)) / (360 / 27); } // 0-1 through nak

/** Planet strength classification */
export function planetStrength(p, lon) {
  const s = signOf(lon);
  if (DEBIL_SIGN[p] === s) return 'debilitated';
  if (EXALT_SIGN[p] === s) return 'exalted';
  if (OWN_SIGNS[p]?.includes(s)) return 'own';
  return '';
}

/* ─── WHOLE-SIGN HOUSES ─── */
export function buildHouses(ascLon, planetsLon) {
  const lagnaSign = signOf(ascLon);
  const houseSignNames = {};
  const signToHouse = {};
  for (let h = 1; h <= 12; h++) {
    const idx = (lagnaSign + h - 1) % 12;
    houseSignNames[h] = ZODIAC[idx];
    signToHouse[idx] = h;
  }
  const planetHouse = { As: 1 };
  for (const [p, lon] of Object.entries(planetsLon)) {
    if (p === 'As') continue;
    planetHouse[p] = signToHouse[signOf(lon)];
  }
  return { houseSignNames, planetHouse };
}

/* ─── VIMSHOTTARI DASHA ─── */
export function calcDasha(moonLon, birthDate) {
  const nakIdx = nakOf(moonLon);
  const lord = NAK_LORDS[nakIdx];
  const progress = nakProgress(moonLon); // how far through the nakshatra (0-1)
  const lordIdx = DASHA_ORDER.indexOf(lord);

  const dashas = [];
  let dt = new Date(birthDate.getTime());

  for (let i = 0; i < 9; i++) {
    const idx = (lordIdx + i) % 9;
    const planet = DASHA_ORDER[idx];
    const fullYrs = DASHA_YRS[planet];
    const yrs = i === 0 ? fullYrs * (1 - progress) : fullYrs;

    const start = new Date(dt.getTime());
    const end = new Date(dt.getTime());
    end.setDate(end.getDate() + Math.round(yrs * 365.25));

    // Antardasha breakdown
    const antardashas = [];
    let adStart = new Date(start.getTime());
    for (let j = 0; j < 9; j++) {
      const aIdx = (idx + j) % 9;
      const aPlanet = DASHA_ORDER[aIdx];
      const aYrs = (yrs * DASHA_YRS[aPlanet]) / 120;
      const adEnd = new Date(adStart.getTime());
      adEnd.setDate(adEnd.getDate() + Math.round(aYrs * 365.25));
      antardashas.push({ planet: aPlanet, start: new Date(adStart), end: adEnd, years: aYrs });
      adStart = new Date(adEnd.getTime());
    }

    dashas.push({ planet, start, end, years: yrs, antardashas });
    dt = new Date(end.getTime());
  }

  return dashas;
}

export function getCurrentDasha(dashas) {
  const now = new Date();
  return dashas.find(d => d.start <= now && d.end > now) || dashas[0];
}

export function getCurrentAntardasha(dasha) {
  if (!dasha?.antardashas) return null;
  const now = new Date();
  return dasha.antardashas.find(d => d.start <= now && d.end > now) || dasha.antardashas[0];
}

export function getNextDasha(dashas) {
  const now = new Date();
  const idx = dashas.findIndex(d => d.start <= now && d.end > now);
  return (idx >= 0 && idx < dashas.length - 1) ? dashas[idx + 1] : null;
}

/* ─── YOGA DETECTION ─── */
export function detectYogas(planetsLon, planetHouse, houseSignNames) {
  const yogas = [];
  const h = planetHouse;

  // Gajakesari Yoga: Jupiter in kendra (1,4,7,10) from Moon
  const moonH = h.Mo;
  const jupH = h.Ju;
  if (moonH && jupH) {
    const diff = ((jupH - moonH + 12) % 12) + 1;
    if ([1, 4, 7, 10].includes(diff) || [1, 4, 7, 10].includes(jupH)) {
      yogas.push({ name: 'Gajakesari Yoga', desc: 'Jupiter in kendra from Moon — intelligence, fame, and prosperity.' });
    }
  }

  // Budhaditya Yoga: Sun and Mercury together
  if (h.Su && h.Me && h.Su === h.Me) {
    yogas.push({ name: 'Budhaditya Yoga', desc: 'Sun and Mercury conjunct — sharp intellect, eloquence, and analytical brilliance.' });
  }

  // Chandra-Mangal Yoga: Moon and Mars together
  if (h.Mo && h.Ma && h.Mo === h.Ma) {
    yogas.push({ name: 'Chandra-Mangal Yoga', desc: 'Moon and Mars conjunct — entrepreneurial spirit and financial ambition.' });
  }

  // Kemadruma Yoga: No planets in 2nd or 12th from Moon
  if (moonH) {
    const moonNeigh2 = ((moonH) % 12) + 1;
    const moonNeigh12 = ((moonH - 2 + 12) % 12) + 1;
    const allH = Object.values(h).filter(x => x);
    const hasNeighbour = allH.some(x => x === moonNeigh2 || x === moonNeigh12);
    if (!hasNeighbour) {
      yogas.push({ name: 'Kemadruma Yoga', desc: 'Moon without planetary neighbours — independence, self-reliance, occasional isolation.' });
    }
  }

  // Pancha Mahapurusha Yogas
  const kendras = [1, 4, 7, 10];
  if (h.Ma && kendras.includes(h.Ma) && [0, 7, 9].includes(signOf(planetsLon.Ma || 0))) {
    yogas.push({ name: 'Ruchaka Yoga', desc: 'Mars in kendra in own/exalt sign — physical power, courage, and leadership.' });
  }
  if (h.Me && kendras.includes(h.Me) && [2, 5, 6].includes(signOf(planetsLon.Me || 0))) {
    yogas.push({ name: 'Bhadra Yoga', desc: 'Mercury in kendra in own/exalt sign — intelligence, business acumen, and communication mastery.' });
  }
  if (h.Ju && kendras.includes(h.Ju) && [2, 3, 11].includes(signOf(planetsLon.Ju || 0))) {
    yogas.push({ name: 'Hamsa Yoga', desc: 'Jupiter in kendra in own/exalt sign — wisdom, morality, and spiritual grace.' });
  }
  if (h.Ve && kendras.includes(h.Ve) && [1, 6, 11].includes(signOf(planetsLon.Ve || 0))) {
    yogas.push({ name: 'Malavya Yoga', desc: 'Venus in kendra in own/exalt sign — beauty, luxury, artistic talent, and romantic success.' });
  }
  if (h.Sa && kendras.includes(h.Sa) && [9, 10, 6].includes(signOf(planetsLon.Sa || 0))) {
    yogas.push({ name: 'Shasha Yoga', desc: 'Saturn in kendra in own/exalt sign — authority, discipline, and lasting success through hard work.' });
  }

  // Kaal Sarp Yoga: all planets between Rahu and Ketu
  if (planetsLon.Ra !== undefined && planetsLon.Ke !== undefined) {
    const raLon = planetsLon.Ra;
    const keLon = planetsLon.Ke;
    const mainPlanets = ['Su','Mo','Ma','Me','Ve','Ju','Sa'].filter(p => planetsLon[p] !== undefined);
    const allBetween = mainPlanets.every(p => {
      const lon = planetsLon[p];
      const diff = norm360(lon - raLon);
      return diff <= 180;
    });
    if (allBetween && mainPlanets.length === 7) {
      yogas.push({ name: 'Kaal Sarp Yoga', desc: 'All planets between Rahu and Ketu — intense karmic focus, periods of struggle followed by dramatic rise.' });
    }
  }

  // Mangal Dosha: Mars in houses 1, 2, 4, 7, 8, 12
  if (h.Ma && [1, 2, 4, 7, 8, 12].includes(h.Ma)) {
    yogas.push({ name: 'Mangal Dosha', desc: 'Mars in a sensitive house — strong energy requiring conscious direction in partnerships and home life.' });
  }

  return yogas;
}

/* ─── ASHTAKAVARGA (simplified) ─── */
export function calcAshtakavarga(planetsLon, planetHouse) {
  // Simplified Sarvashtakavarga: count benefic planets relative to each house
  const benefics = ['Ju', 'Ve', 'Me', 'Mo'];
  const scores = {};
  for (let h = 1; h <= 12; h++) {
    let score = 0;
    for (const p of benefics) {
      if (planetHouse[p] === h) score += 2;
    }
    // Trine houses from each benefic get +1
    for (const p of benefics) {
      const ph = planetHouse[p];
      if (!ph) continue;
      const trine1 = ((ph + 3) % 12) + 1;
      const trine2 = ((ph + 7) % 12) + 1;
      if (h === trine1 || h === trine2) score++;
    }
    scores[h] = Math.min(score, 8); // cap at 8 per standard
  }
  return scores;
}

/* ─── FORMATTING HELPERS ─── */
export function fmtDate(d) {
  if (!d) return '?';
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}
export function fmtYM(d) {
  if (!d) return '?';
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short' });
}
export function calcAge(dob) {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}
export function dayName(d) {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
}
export function abbrev(name) {
  const m = { Sun:'Su', Moon:'Mo', Mars:'Ma', Mercury:'Me', Venus:'Ve', Jupiter:'Ju', Saturn:'Sa', Rahu:'Ra', Ketu:'Ke' };
  return m[name] || name.substring(0, 2);
}
export function ordinal(n) {
  return ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'][(n || 1) - 1];
}
export function norm360(v) { return ((v % 360) + 360) % 360; }
