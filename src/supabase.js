/**
 * COSMIC KUNDALI — Supabase Integration (Optional)
 * Allows saving and loading Kundali charts
 *
 * HOW TO SET UP SUPABASE (Free — no credit card):
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Go to → https://supabase.com → Sign Up (free)
 * 2. Click "New Project" → choose a name → set a DB password → Create
 * 3. Go to Project Settings → API
 *    • Copy "Project URL"   → paste as VITE_SUPABASE_URL in .env
 *    • Copy "anon / public" → paste as VITE_SUPABASE_ANON_KEY in .env
 * 4. Go to Table Editor → New Table → name it "kundali_charts"
 *    Add these columns:
 *      id          uuid (default: gen_random_uuid())  PRIMARY KEY
 *      name        text
 *      gender      text
 *      dob         text
 *      tob         text
 *      place       text
 *      lat         float8
 *      lng         float8
 *      lagna_sign  text
 *      moon_sign   text
 *      sun_sign    text
 *      moon_nak    text
 *      lagna_nak   text
 *      chart_data  jsonb
 *      created_at  timestamptz (default: now())
 * 5. In Row Level Security (RLS): Disable it (for personal use) OR
 *    enable and add policy: "Allow all" for anon role (public demo)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Read credentials from environment variables (set in .env)
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const SUPABASE_ENABLED = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';

/** Generic Supabase REST API request */
async function supabaseRequest(endpoint, method = 'GET', body = null) {
  if (!SUPABASE_ENABLED) throw new Error('Supabase not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file');

  const url = `${SUPABASE_URL}/rest/v1${endpoint}`;
  const headers = {
    'apikey':        SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=representation',
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error ${res.status}: ${err}`);
  }

  return res.status === 204 ? null : res.json();
}

/**
 * Save a Kundali chart to the database
 * @param {Object} chartData - the full computed chart data object
 * @returns {Object} saved record
 */
export async function saveChart(chartData) {
  const record = {
    name:       chartData.name,
    gender:     chartData.gender,
    dob:        chartData.dob,
    tob:        chartData.tob,
    place:      chartData.place,
    lat:        chartData.lat,
    lng:        chartData.lng,
    lagna_sign: chartData.lagnaSign,
    moon_sign:  chartData.moonSign,
    sun_sign:   chartData.sunSign,
    moon_nak:   chartData.moonNak,
    lagna_nak:  chartData.lagnaNak,
    chart_data: {
      planetsLon:   chartData.planetsLon,
      houseSignNames: chartData.houseSignNames,
      planetHouse:  chartData.planetHouse,
      yogas:        chartData.yogas,
      currentDasha: chartData.currentDasha
        ? { planet: chartData.currentDasha.planet, end: chartData.currentDasha.end }
        : null,
    },
  };

  const result = await supabaseRequest('/kundali_charts', 'POST', record);
  return Array.isArray(result) ? result[0] : result;
}

/**
 * Load recent saved charts (last 20)
 * @returns {Array} list of saved charts
 */
export async function loadRecentCharts() {
  return supabaseRequest('/kundali_charts?select=id,name,dob,place,lagna_sign,moon_sign,created_at&order=created_at.desc&limit=20');
}

/**
 * Load a specific chart by ID
 * @param {string} id - UUID of the chart
 * @returns {Object} chart record
 */
export async function loadChartById(id) {
  const result = await supabaseRequest(`/kundali_charts?id=eq.${id}&select=*`);
  return Array.isArray(result) ? result[0] : result;
}

/**
 * Delete a chart by ID
 * @param {string} id - UUID of the chart
 */
export async function deleteChart(id) {
  return supabaseRequest(`/kundali_charts?id=eq.${id}`, 'DELETE');
}
