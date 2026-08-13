/**
 * COSMIC KUNDALI — Prokerala API Integration
 * Fetches precise data when CLIENT_ID and CLIENT_SECRET are configured
 * Falls back to local astronomy-engine otherwise
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PROKERALA_CONFIG } from './config.js';

let _token = null;
let _tokenExpiry = 0;

/** Get or refresh OAuth token */
async function getToken() {
  if (_token && Date.now() < _tokenExpiry - 60000) return _token;

  const res = await fetch(PROKERALA_CONFIG.TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: PROKERALA_CONFIG.CLIENT_ID,
      client_secret: PROKERALA_CONFIG.CLIENT_SECRET,
    }),
  });

  if (!res.ok) throw new Error(`Token error: ${res.status}`);
  const data = await res.json();
  _token = data.access_token;
  _tokenExpiry = Date.now() + data.expires_in * 1000;
  return _token;
}

/** Make authenticated API request */
async function apiGet(endpoint, params) {
  const token = await getToken();
  const url = new URL(`${PROKERALA_CONFIG.BASE_URL}${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Format datetime for Prokerala (ISO 8601 with timezone) */
function fmtProkeralaDate(year, month, day, hour, minute, tzOffset) {
  const pad = n => String(n).padStart(2, '0');
  const sign = tzOffset >= 0 ? '+' : '-';
  const absOff = Math.abs(tzOffset);
  const offH = Math.floor(absOff);
  const offM = Math.round((absOff - offH) * 60);
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00${sign}${pad(offH)}:${pad(offM)}`;
}

/**
 * Fetch planet positions from Prokerala (Swiss Ephemeris precision)
 * Returns: { planets: {...}, ascendant: {...}, houses: [...] }
 */
export async function fetchPlanetPositions(year, month, day, hour, minute, lat, lng, tz) {
  const datetime = fmtProkeralaDate(year, month, day, hour, minute, tz);
  const data = await apiGet('/planet-position', {
    datetime,
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    ayanamsa: PROKERALA_CONFIG.AYANAMSA,
  });
  return data.data;
}

/**
 * Fetch full birth chart data (Kundali)
 * Returns detailed chart info including house cusps
 */
export async function fetchBirthChart(year, month, day, hour, minute, lat, lng, tz) {
  const datetime = fmtProkeralaDate(year, month, day, hour, minute, tz);
  const data = await apiGet('/kundli', {
    datetime,
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    ayanamsa: PROKERALA_CONFIG.AYANAMSA,
    chart_style: PROKERALA_CONFIG.CHART_STYLE,
  });
  return data.data;
}

/**
 * Fetch Vimshottari Dasha periods
 */
export async function fetchDasha(year, month, day, hour, minute, lat, lng, tz) {
  const datetime = fmtProkeralaDate(year, month, day, hour, minute, tz);
  const data = await apiGet('/dasha-periods', {
    datetime,
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    ayanamsa: PROKERALA_CONFIG.AYANAMSA,
  });
  return data.data;
}

/**
 * Fetch Yoga list (Raj Yoga, Dhana Yoga, etc.)
 */
export async function fetchYogas(year, month, day, hour, minute, lat, lng, tz) {
  const datetime = fmtProkeralaDate(year, month, day, hour, minute, tz);
  const data = await apiGet('/yoga-list', {
    datetime,
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    ayanamsa: PROKERALA_CONFIG.AYANAMSA,
  });
  return data.data;
}

/**
 * Fetch Mangal Dosha info
 */
export async function fetchMangalDosha(year, month, day, hour, minute, lat, lng, tz) {
  const datetime = fmtProkeralaDate(year, month, day, hour, minute, tz);
  const data = await apiGet('/mangal-dosha', {
    datetime,
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    ayanamsa: PROKERALA_CONFIG.AYANAMSA,
  });
  return data.data;
}

/**
 * Main function: fetch everything from Prokerala in parallel
 * Returns normalised data in the same format as local engine
 */
export async function fetchAllFromProkerala(year, month, day, hour, minute, lat, lng, tz) {
  const [positions, chart, dasha, yogas, mangal] = await Promise.allSettled([
    fetchPlanetPositions(year, month, day, hour, minute, lat, lng, tz),
    fetchBirthChart(year, month, day, hour, minute, lat, lng, tz),
    fetchDasha(year, month, day, hour, minute, lat, lng, tz),
    fetchYogas(year, month, day, hour, minute, lat, lng, tz),
    fetchMangalDosha(year, month, day, hour, minute, lat, lng, tz),
  ]);

  return {
    positions: positions.status === 'fulfilled' ? positions.value : null,
    chart:     chart.status     === 'fulfilled' ? chart.value     : null,
    dasha:     dasha.status     === 'fulfilled' ? dasha.value     : null,
    yogas:     yogas.status     === 'fulfilled' ? yogas.value     : null,
    mangal:    mangal.status    === 'fulfilled' ? mangal.value    : null,
  };
}

/**
 * Normalise Prokerala planet position data to match our local format
 * Prokerala returns { planet, longitude, sign, nakshatra, ... }
 */
export function normaliseProkeralaPositions(apiData) {
  if (!apiData?.planets) return null;

  const ABBR_MAP = {
    'Sun': 'Su', 'Moon': 'Mo', 'Mars': 'Ma', 'Mercury': 'Me',
    'Venus': 'Ve', 'Jupiter': 'Ju', 'Saturn': 'Sa',
    'Rahu': 'Ra', 'Ketu': 'Ke', 'Ascendant': 'As'
  };

  const planetsLon = {};
  const details = {}; // store full details from API

  for (const planet of apiData.planets) {
    const abbr = ABBR_MAP[planet.name];
    if (abbr) {
      planetsLon[abbr] = planet.longitude;
      details[abbr] = {
        lon: planet.longitude,
        sign: planet.sign?.name,
        degree: planet.degree,
        minute: planet.minute,
        second: planet.second,
        nakshatra: planet.nakshatra?.name,
        nakshatraPada: planet.nakshatra?.pada,
        isRetrograde: planet.is_retrograde,
        speed: planet.speed,
      };
    }
  }

  if (apiData.ascendant) {
    planetsLon.As = apiData.ascendant.longitude;
    details.As = {
      lon: apiData.ascendant.longitude,
      sign: apiData.ascendant.sign?.name,
      degree: apiData.ascendant.degree,
      nakshatra: apiData.ascendant.nakshatra?.name,
    };
  }

  return { planetsLon, details };
}
