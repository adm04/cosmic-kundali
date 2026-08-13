/**
 * COSMIC KUNDALI — API Configuration
 * Credentials are loaded from .env (never hardcode secrets here)
 * ─────────────────────────────────────────────────────────────────────────────
 * PROKERALA API (Free tier — 5,000 credits/month)
 *
 * How to get your FREE keys:
 *   1. Go to → https://api.prokerala.com/get-api-token
 *   2. Register / Sign in with Google
 *   3. Click "Create New Application"
 *   4. Copy your Client ID and Client Secret below
 *
 * What Prokerala gives us that our local engine can't:
 *   • Exact degrees/minutes/seconds for all planets (Swiss Ephemeris precision)
 *   • Ashtakavarga scores per planet per house
 *   • Navamsa (D9) chart planetary positions
 *   • Sade Sati / Dhaiya (Saturn transit) periods
 *   • Full Antardasha / Pratyantardasha tree (not just Mahadasha)
 *   • Yoga detection (Raja Yoga, Dhana Yoga, Viparita Raja Yoga etc.)
 *   • Marriage compatibility (Kundali Milan / Ashtakuta scoring)
 *   • Mangal Dosha / Kaal Sarp Dosha detection
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const PROKERALA_CONFIG = {
  // Credentials loaded from .env — copy .env.example → .env and fill in
  CLIENT_ID:     import.meta.env.VITE_PROKERALA_CLIENT_ID     || '',
  CLIENT_SECRET: import.meta.env.VITE_PROKERALA_CLIENT_SECRET || '',

  // API endpoints
  TOKEN_URL: 'https://api.prokerala.com/token',
  BASE_URL:  'https://api.prokerala.com/v2/astrology',

  // Ayanamsa system (Lahiri is standard for North Indian Vedic)
  AYANAMSA: 1,  // 1 = Lahiri, 2 = Raman, 3 = Krishnamurti (KP)

  // Coordinate system for chart
  CHART_STYLE: 'north-indian',

  // Set to true once you paste your credentials above
  get ENABLED() {
    return this.CLIENT_ID !== '' && this.CLIENT_SECRET !== '';
  }
};

/**
 * CITY DATABASE — lat/lng for major cities
 * Used for Ascendant calculation (requires latitude)
 */
export const CITIES = {
  'kolkata':     { lat: 22.5726, lng: 88.3639, tz: 5.5 },
  'mumbai':      { lat: 19.0760, lng: 72.8777, tz: 5.5 },
  'delhi':       { lat: 28.7041, lng: 77.1025, tz: 5.5 },
  'new delhi':   { lat: 28.6139, lng: 77.2090, tz: 5.5 },
  'bangalore':   { lat: 12.9716, lng: 77.5946, tz: 5.5 },
  'bengaluru':   { lat: 12.9716, lng: 77.5946, tz: 5.5 },
  'chennai':     { lat: 13.0827, lng: 80.2707, tz: 5.5 },
  'hyderabad':   { lat: 17.3850, lng: 78.4867, tz: 5.5 },
  'pune':        { lat: 18.5204, lng: 73.8567, tz: 5.5 },
  'ahmedabad':   { lat: 23.0225, lng: 72.5714, tz: 5.5 },
  'jaipur':      { lat: 26.9124, lng: 75.7873, tz: 5.5 },
  'lucknow':     { lat: 26.8467, lng: 80.9462, tz: 5.5 },
  'varanasi':    { lat: 25.3176, lng: 82.9739, tz: 5.5 },
  'patna':       { lat: 25.5941, lng: 85.1376, tz: 5.5 },
  'bhopal':      { lat: 23.2599, lng: 77.4126, tz: 5.5 },
  'nagpur':      { lat: 21.1458, lng: 79.0882, tz: 5.5 },
  'surat':       { lat: 21.1702, lng: 72.8311, tz: 5.5 },
  'indore':      { lat: 22.7196, lng: 75.8577, tz: 5.5 },
  'chandigarh':  { lat: 30.7333, lng: 76.7794, tz: 5.5 },
  'kochi':       { lat:  9.9312, lng: 76.2673, tz: 5.5 },
  'guwahati':    { lat: 26.1445, lng: 91.7362, tz: 5.5 },
  'bhubaneswar': { lat: 20.2961, lng: 85.8245, tz: 5.5 },
  'london':      { lat: 51.5074, lng: -0.1278, tz: 0   },
  'new york':    { lat: 40.7128, lng:-74.0060, tz:-5   },
  'los angeles': { lat: 34.0522, lng:-118.2437,tz:-8   },
  'sydney':      { lat:-33.8688, lng:151.2093, tz: 10  },
  'dubai':       { lat: 25.2048, lng: 55.2708, tz: 4   },
  'singapore':   { lat:  1.3521, lng:103.8198, tz: 8   },
  'paris':       { lat: 48.8566, lng:  2.3522, tz: 1   },
  'toronto':     { lat: 43.6532, lng:-79.3832, tz:-5   },
  'chicago':     { lat: 41.8781, lng:-87.6298, tz:-6   },
  'houston':     { lat: 29.7604, lng:-95.3698, tz:-6   },
  'berlin':      { lat: 52.5200, lng: 13.4050, tz: 1   },
  'tokyo':       { lat: 35.6762, lng:139.6503, tz: 9   },
};

export function lookupCity(name) {
  const key = name.toLowerCase().replace(/,.*$/, '').trim();
  for (const k in CITIES) {
    if (key.includes(k) || k.includes(key)) return CITIES[k];
  }
  return { lat: 23.0, lng: 81.0, tz: 5.5 }; // India center fallback
}
