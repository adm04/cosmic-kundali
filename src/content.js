/**
 * COSMIC KUNDALI — Tab Content Generator
 * Generates rich narrative content for all 5 tabs
 * Uses actual computed chart data for personalised output
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  ZODIAC, RULERS, NAKSHATRA, NAK_DEITY, NAK_SYMBOL,
  PNAME, DASHA_YRS, DASHA_ORDER,
  signOf, nakOf, nakPada, planetStrength,
  ordinal, fmtYM, fmtDate
} from './astro-engine.js';

/* ─── LOOKUP TABLES ─── */
const SIGN_DESC = {
  Aries:        'a pioneer and natural leader — quick-thinking, bold, and energised by new beginnings',
  Taurus:       'sensual, patient and deeply persistent — you build things that last',
  Gemini:       'intellectually agile and socially gifted — you thrive on variety, connection, and ideas',
  Cancer:       'emotionally intelligent and nurturing — your instincts and intuitive radar are unusually reliable',
  Leo:          'radiant and self-expressive — you carry a natural charisma and a hunger to create',
  Virgo:        'analytical, service-oriented and devoted to craft — you care about quality in all things',
  Libra:        'a natural diplomat who seeks beauty, harmony, and balance in every arena of life',
  Scorpio:      'penetrating and transformative — you deal in depth, not surface, and rarely leave a room unchanged',
  Sagittarius:  'philosophical and freedom-seeking — you follow meaning over routine and truth over comfort',
  Capricorn:    'ambitious and disciplined — you build patiently, trusting the long view when others lose faith',
  Aquarius:     'original and forward-thinking — you see what is coming before most have noticed it is arriving',
  Pisces:       'empathic and deeply intuitive — you carry the ocean within you, absorbing atmosphere and feeling',
};

const NAK_DESC = {
  Ashwini:           { essence: 'swift healing and pioneering instinct', shadow: 'impatience and a tendency to abandon what it started', gift: 'the capacity to initiate and restore' },
  Bharani:           { essence: 'restraint, responsibility, and depth of feeling', shadow: 'the weight of carrying what others leave behind', gift: 'tremendous endurance and a deep sense of dharma' },
  Krittika:          { essence: 'purifying fire and decisive clarity', shadow: 'a cutting edge that burns what it meant to illuminate', gift: 'the ability to separate truth from illusion with precision' },
  Rohini:            { essence: 'a magnetic pull toward beauty, fertility, and sensory richness', shadow: 'possessiveness and an attachment to the beautiful that can become clinging', gift: 'the capacity to make things grow and to cultivate what is genuinely beautiful' },
  Mrigashira:        { essence: 'eternal seeking — curiosity, restlessness, and a refined aesthetic sense', shadow: 'an inability to arrive, always moving toward the next horizon', gift: 'a piercing intelligence and a nose for what is authentic' },
  Ardra:             { essence: 'the storm before clarity — emotional intensity that, once passed, leaves the air clean', shadow: 'destructive impulsivity and a tendency to experience life as turbulence', gift: 'the capacity to break down what is no longer serving and rebuild with intention' },
  Punarvasu:         { essence: 'a return to light after difficulty — resilience and a faith that regenerates', shadow: 'over-optimism that repeats old cycles expecting different results', gift: 'a rare combination of compassion and renewal that sustains those around it' },
  Pushya:            { essence: 'a nurturing force that sustains others while feeding on purpose', shadow: 'self-neglect in the service of others, and an over-attachment to being needed', gift: 'the purest expression of care in the zodiac — genuine, practical, and unwavering' },
  Ashlesha:          { essence: 'a coiled awareness — penetrating, hypnotic, and transmutative', shadow: 'the coil that constricts rather than transforms — control, suspicion, and emotional withholding', gift: 'the capacity to transmute what is poisonous into medicine; a rare psychic permeability used well' },
  Magha:             { essence: 'the throne of the ancestors — dignity, authority, and a deep sense of lineage', shadow: 'pride that becomes arrogance, and a nostalgia that resists what is new', gift: 'a natural regality and the ability to honour what came before while leading what comes next' },
  'Purva Phalguni':  { essence: 'pleasure and creative expression as a genuine spiritual path', shadow: 'indulgence, laziness, and a love of comfort that avoids necessary discomfort', gift: 'an extraordinary capacity for joy, beauty, and connection that uplifts those it touches' },
  'Uttara Phalguni': { essence: 'the marriage of service and self — you shine most when giving', shadow: 'a tendency to lose the self in service, expecting gratitude that does not always come', gift: 'steady, reliable, and deeply principled — the kind of person who holds things together without drama' },
  Hasta:             { essence: 'precise craftsmanship and a healing quality that flows through the hands', shadow: 'manipulation and a cleverness that can tip into cunning', gift: 'an almost magical dexterity — physical, creative, and interpersonal — that achieves through precision' },
  Chitra:            { essence: 'a jewel of artistry — you create beauty as a cosmic act of ordering the world', shadow: 'vanity, and a perfectionism that can prevent completion', gift: 'a genuine aesthetic intelligence and a desire to make the world more beautiful as a form of devotion' },
  Swati:             { essence: 'independence and the wind\'s freedom — you resist containment by nature', shadow: 'scatteredness, inconsistency, and a fear of commitment that prevents depth', gift: 'remarkable adaptability and a lightness of being that can move through situations others find immovable' },
  Vishakha:          { essence: 'focused ambition directed toward a singular, burning goal', shadow: 'jealousy, competitiveness, and a scorched-earth approach to obstacles', gift: 'extraordinary persistence and the capacity to achieve what seemed impossible through sheer will' },
  Anuradha:          { essence: 'loyalty and devotion — you build lasting bonds across time and difficulty', shadow: 'possessive attachment and a tendency to carry grudges dressed as loyalty', gift: 'a warmth and reliability that becomes a cornerstone for those who know you' },
  Jyeshtha:          { essence: 'the elder\'s authority — leadership carried as both burden and gift', shadow: 'arrogance of seniority and a tendency to isolate rather than delegate', gift: 'a genuine protective instinct and the courage to take responsibility when others step back' },
  Mula:              { essence: 'the root of things — driven to uncover what is hidden beneath the surface', shadow: 'a destructive streak that dismantles what it cannot understand', gift: 'a philosophical depth and a hunger for ultimate truth that can illuminate entire fields' },
  'Purva Ashadha':   { essence: 'invincibility of spirit — you do not yield when you believe in something', shadow: 'stubbornness that refuses course-correction even when wrong', gift: 'a courage and tenacity that inspires others and outlasts adversity' },
  'Uttara Ashadha':  { essence: 'final victory through patience and sustained, principled effort', shadow: 'inflexibility and a reluctance to adapt once a course is set', gift: 'a character of deep integrity that achieves lasting things by refusing shortcuts' },
  Shravana:          { essence: 'the gift of listening — you hear what others miss and learn in all directions', shadow: 'an over-receptivity that can absorb others\' problems as your own', gift: 'a capacity for genuine connection and learning that makes you wise beyond your years' },
  Dhanistha:         { essence: 'abundance through action — you are made to achieve and share what you achieve', shadow: 'arrogance of wealth, and a giving that seeks recognition', gift: 'an energy and generosity that tends to attract what it needs and enjoy sharing it' },
  Shatabhisha:       { essence: 'the healer of hidden wounds — a mysterious solitude that clarifies', shadow: 'eccentricity that becomes isolation, and a withholding of self from connection', gift: 'a penetrating intellectual independence and a capacity to heal what others have given up on' },
  'Purva Bhadrapada':{ essence: 'a fire that purifies — intensity seeking transformation at any cost', shadow: 'fanaticism and a willingness to burn down what is merely imperfect', gift: 'a fearlessness and intensity that can achieve breakthroughs no more temperate approach could reach' },
  'Uttara Bhadrapada':{ essence:'depths of compassion and a cosmic understanding of suffering as purpose', shadow: 'paralysis in the face of the infinite, and a melancholy that resists joy', gift: 'a wisdom and empathy that can hold the most complex human experiences with grace' },
  Revati:            { essence: 'nurturing, mystical, and eternally kind — the last nakshatra holds the whole', shadow: 'a tendency to linger, and a sentimentality that resists necessary endings', gift: 'a compassion and spiritual richness that sustains others through its very presence' },
};

const CAREER_Q = {
  Aries:        'pioneering ventures, startups, sports, surgery, military, or any field rewarding speed and initiative',
  Taurus:       'finance, luxury, agriculture, arts, music, real estate, or any field requiring patient accumulation of value',
  Gemini:       'writing, journalism, coding, trade, law, media, or any role rewarding versatile and quick-switching intellect',
  Cancer:       'caregiving, real estate, hospitality, food, psychology, or any field with emotional and human resonance',
  Leo:          'leadership, entertainment, politics, education, fashion, or any platform that rewards presence and confidence',
  Virgo:        'medicine, research, analytics, editing, auditing, nutrition, or any precision-craft that genuinely serves others',
  Libra:        'law, diplomacy, design, mediation, human resources, or any domain requiring fairness and aesthetic judgment',
  Scorpio:      'investigation, surgery, psychology, insurance, occult research, or any transformation-focused field',
  Sagittarius:  'teaching, publishing, law, religion, travel, international work, or any field rooted in higher meaning and principle',
  Capricorn:    'government, corporate management, engineering, banking, or any structure-building that rewards longevity',
  Aquarius:     'technology, social enterprise, innovation, science, NGOs, or any field that serves a collective vision',
  Pisces:       'arts, healing, spirituality, film, charity, counselling, or any domain where intuition and imagination are the raw material',
};

const LOVE_Q = {
  Aries:        'directness, passion, independence, and a refreshing spontaneity that never plays games',
  Taurus:       'sensuality, groundedness, loyalty, and a love of beauty and comfort in shared life',
  Gemini:       'wit, intellectual stimulation, adaptability, and the ability to keep conversation endlessly alive',
  Cancer:       'emotional depth, protective warmth, and a loyalty that feels like home',
  Leo:          'warmth, generosity, confidence, and a generous dramatic flair that makes life feel significant',
  Virgo:        'attentiveness, practical devotion, reliability, and a caring that shows up in the details',
  Libra:        'elegance, romantic thoughtfulness, fairness, and a social grace that makes the world feel more harmonious',
  Scorpio:      'intensity, depth, transformative power, and an unwavering loyalty that survives what would end lesser bonds',
  Sagittarius:  'philosophical depth, freedom, adventure, and a honesty that refuses comfortable lies',
  Capricorn:    'stability, ambition, understated devotion, and a commitment that grows more solid over time',
  Aquarius:     'originality, friendship-as-love, progressive values, and an emotional independence that honours yours',
  Pisces:       'empathy, imagination, spiritual connection, and a compassion that can see you before you see yourself',
};

const BODY_FOCUS = {
  Aries: 'Head, brain, eyes, and adrenal system',
  Taurus: 'Throat, thyroid, voice, and cervical spine',
  Gemini: 'Lungs, bronchi, nervous system, and shoulders',
  Cancer: 'Chest, breasts, stomach, lymphatic system',
  Leo: 'Heart, spine, upper back, and vitality reserves',
  Virgo: 'Intestines, digestion, pancreas, and gut microbiome',
  Libra: 'Kidneys, lumbar spine, adrenal cortex, and skin',
  Scorpio: 'Reproductive organs, excretory system, and colon',
  Sagittarius: 'Hips, thighs, sciatic nerve, and liver',
  Capricorn: 'Knees, joints, bones, and skeletal structure',
  Aquarius: 'Circulation, ankles, calves, and nervous system',
  Pisces: 'Feet, lymphatics, immune system, and sleep architecture',
};

const HEALTH_STRESS = {
  Aries: 'Heat, inflammation, headaches, and eye strain signal the first signs of overload. The adrenal system burns fast and needs adequate recovery cycles.',
  Taurus: 'The throat, jaw, and thyroid carry the weight of unexpressed emotion. Chronic neck tension and thyroid fluctuations are worth watching over a lifetime.',
  Gemini: 'Anxiety, racing thoughts, respiratory sensitivity, and scattered energy are the primary stress channels. The nervous system is a live wire that needs grounding.',
  Cancer: 'The gut and chest are where emotional overwhelm crystallises first. Digestive sensitivity and upper respiratory issues tend to carry an emotional signature.',
  Leo: 'The heart, spine, and blood pressure carry the load. Back tension, cardiac sensitivity, and vitality dips follow periods of sustained emotional output.',
  Virgo: 'Digestive upset, nervous-system overdrive, and skin reactions are the classic stress signatures. The gut-brain axis is unusually sensitive here.',
  Libra: 'Kidney function, lower back tension, and skin conditions respond quickly to imbalance. Hormonal fluctuations and adrenal fatigue are worth monitoring.',
  Scorpio: 'Reproductive health and eliminative function carry the charge of suppressed intensity. Deep detox and emotional release are literal physical necessities.',
  Sagittarius: 'Hip tightness, sciatic pain, and liver strain arise under prolonged mental stress. Excessive philosophising without physical release has a physical cost.',
  Capricorn: 'Joints, knees, and bone density are the long-term signals. Arthritis, dental issues, and structural fatigue appear when the drive to achieve overrules the need to rest.',
  Aquarius: 'Circulatory irregularity, varicose veins, ankle issues, and erratic sleep signal the body\'s early warnings. The nervous system is highly sensitive to irregular schedules.',
  Pisces: 'Foot issues, immune suppression, lymphatic congestion, and sleep disorders are the first physical vocabulary this rising sign speaks.',
};

const EXERCISE_NOTE = {
  Aries: 'High-intensity, competitive, or martial training works well — but pair each hard session with deliberate recovery. Inflammation is the specific risk.',
  Taurus: 'Steady, pleasurable movement — yoga, long walks, swimming — far outperforms high-intensity training for this constitution. Enjoyment is the key to consistency.',
  Gemini: 'Variety is your consistency strategy — dance, cycling, swimming, or sport requiring coordination and quick thinking. Monotonous routines collapse quickly.',
  Cancer: 'Swimming and water-based movement are unusually restorative. If access is limited, warm baths, steam, and gentle floor yoga achieve a similar regulatory effect.',
  Leo: 'Movement combined with pleasure and play — dance, yoga to music, team sports, outdoor circuits — sustains the motivation this constitution needs.',
  Virgo: 'Precise, form-focused movement — Pilates, yoga, martial arts, or calibrated weightlifting — aligns with your constitution\'s love of craft applied to the body.',
  Libra: 'Partner-based or social movement — partner yoga, dance, doubles tennis — keeps you motivated where solo training stalls. Balance training is specifically beneficial.',
  Scorpio: 'Intensity-releasing practices: martial arts, long-distance swimming, hot yoga, or weight training with intentional breath. The body needs the intensity the mind handles daily.',
  Sagittarius: 'Outdoor movement in open landscapes — hiking, trail running, cycling in nature — is far more restorative than any gym. The body responds to horizon.',
  Capricorn: 'Weight-bearing, joint-supportive exercise — structured yoga, hiking, swimming — protects the structural vulnerabilities while building the endurance this body excels at.',
  Aquarius: 'Unconventional, socially or intellectually stimulating movement — group classes with a cause, aerial yoga, team sports with a thinking component — sustain engagement.',
  Pisces: 'Gentle, flowing, water-element movement — tai chi, restorative yoga, swimming, aqua aerobics — is far more effective than high-impact training for this constitution.',
};

const WEALTH_H11 = {
  Aries: 'Gains come to those who move first — the first-mover advantage is specifically available to this placement if acted on.',
  Taurus: 'Gains accumulate slowly, solidly, and with endurance — wealth is built the way everything else is built here: patiently.',
  Gemini: 'Multiple income streams, intellectual ventures, and writing or media are natural gain channels.',
  Cancer: 'Gains often tied to family enterprise, real estate, food, or nurturing ventures.',
  Leo: 'Public recognition and leadership roles open the financial doors — visibility is the gateway.',
  Virgo: 'Service, precision-craft, health, and analytical fields are where gains naturalise.',
  Libra: 'Partnership structures, aesthetic endeavours, and negotiation are the primary gain channels.',
  Scorpio: 'Investment, inheritance, research, and transformation-focused ventures are where abundance concentrates.',
  Sagittarius: 'Teaching, publishing, travel, and higher knowledge work as pathways to financial expansion.',
  Capricorn: 'Career achievements, structural expertise, and long-service recognition are the primary channels.',
  Aquarius: 'Technology, innovation, collective causes, and future-facing ventures are where gains flow.',
  Pisces: 'Creative, spiritual, and imaginative ventures — film, music, healing, art — carry the greatest potential.',
};

const PLANET_UPAYA = {
  Su: 'On Sundays, offer water to the rising sun and recite the Aditya Hridayam or Gayatri Mantra. Donate wheat or red cloth. Serve or honour your father.',
  Mo: 'On Mondays, offer white flowers or milk at a Shiva or Devi shrine. Fast on Mondays or eat lightly. Spend time near water. Strengthen your relationship with your mother.',
  Ma: 'On Tuesdays, a physical discipline or act of physical courage. Donate red lentils or red cloth. Recite the Mangal Beej Mantra. Manage anger through movement, not suppression.',
  Me: 'On Wednesdays, donate green moong dal or green vegetables to charity. Recite "Om Budhaya Namaha" 108 times before important communication events. Serve young people or students.',
  Ve: 'On Fridays, offer white or pink flowers to Lakshmi. Create something beautiful — cook, draw, write. Fast lightly or eat pure vegetarian food. Practice gratitude for beauty in your life.',
  Ju: 'On Thursdays, make a small act of generosity or spend 20 minutes in serious study. Offer yellow foods to a temple or donate to a teacher. Recite the Guru Mantra.',
  Sa: 'On Saturdays, simplify: fast, or eat simply. Offer sesame seeds or black sesame oil at a Shani shrine. Serve the elderly or disadvantaged. Honour the principle of patient effort.',
  Ra: 'Feed the poor on Saturdays. Recite the Rahu Beej Mantra. Avoid impulsive decisions, especially on Saturdays. Wear a hessonite (gomed) only after consultation.',
  Ke: 'On Tuesdays, acts of spiritual humility — charity to the poor, service to animals. Recite Ganesha mantras. Avoid attachment to outcomes. Donate multi-colored blankets.',
};

const DASHA_NOTES = {
  Su: { career: 'Authority, government, leadership, and public visibility are activated. Pitch yourself boldly — the Sun rewards those who step forward.', love: 'A period of self-focus; love may feel secondary. Honour your needs without completely disappearing from partnership.', health: 'Vitality peaks, but overexertion and heat-related issues are specific risks. Rest is not weakness in this period.', wealth: 'Status-linked income and recognition bring financial upgrades. Avoid ego-driven expenditure.' },
  Mo: { career: 'Intuition leads the way. Career moves guided by feeling tend to land well. Public-facing and care-related work thrives.', love: 'Emotional attunement peaks — a powerful period for deepening existing bonds or attracting a soulful connection.', health: 'Fluctuations in energy mirror emotional fluctuations. Water, rest, and emotional processing are the primary medicines.', wealth: 'Income may fluctuate, but emotional intelligence becomes an economic asset. Mind liquid investments.' },
  Ma: { career: 'High energy, drive, and competitiveness activate the career. Bold action and healthy assertion are specifically rewarded now.', love: 'Passion intensifies. Be conscious of aggression; channel Mars\'s fire into initiation rather than confrontation.', health: 'Physical stamina peaks, but injury from overexertion and inflammation from anger are specific risks.', wealth: 'Brave financial moves — new ventures, negotiations, asset acquisition — tend to succeed in this window.' },
  Me: { career: 'Communication, skill-building, networking, and intellectual output are in focus. An ideal time for pitching, writing, launching, and learning.', love: 'Connection through conversation and shared intellectual life deepens bonds. Light, playful, and communicative energy.', health: 'Nervous system sensitivity increases. Meditation, journaling, and screen-time management are specifially important.', wealth: 'Trade, communication, technology, and multiple income streams are naturally supported.' },
  Ve: { career: 'Creative fields, relationships, luxury, beauty, and anything where aesthetics or diplomacy matter come to the fore.', love: 'One of the most favourable periods for love, marriage, and romantic connection. Existing bonds deepen; new connections have real staying power.', health: 'Indulgent tendencies can affect the kidneys and blood sugar. Pleasure in moderation is the specific guidance.', wealth: 'Aesthetic ventures, luxury goods, fashion, beauty, and relationship-linked income do well.' },
  Ju: { career: 'Expansion, wisdom, and mentorship mark this period — likely the strongest window in a cycle for growth, title change, or stepping into genuine authority.', love: 'A period of philosophical depth in relationships. Meaningful bonds, shared values, and commitment are all available.', health: 'The most naturally vital period in the dasha cycle for most people. Weight management and liver health are worth maintaining.', wealth: 'The single most favourable period for genuine financial expansion if foundations are sound.' },
  Sa: { career: 'Patience and consistent, methodical work compound into something lasting. No shortcuts — but the work done now has the longest half-life of any period.', love: 'Relationships are tested for their structural soundness. What is real remains; what is performative falls away.', health: 'Joint, bone, and dental health need attention. Chronic tiredness signals the need for structural rest, not just sleep.', wealth: 'Slow and steady gains. Financial discipline in this period creates a foundation that outlasts the cycle.' },
  Ra: { career: 'Obsessive drive, unconventional ambition, and disruption are highlighted. Technology, foreign connections, and rule-breaking moves can achieve unusual results.', love: 'Intense, sometimes destabilising attraction. Unusual relationships. Be cautious of obsession masquerading as connection.', health: 'The most unpredictable health period. Unconventional or alternative medicine may be specifically effective.', wealth: 'Speculative ventures may seem compelling; approach with one eye on the fog. Genuine breakthroughs are also possible.' },
  Ke: { career: 'Inner work, spiritual clarity, and letting go of old career identities. Gains are often indirect, but the direction that emerges carries unusual precision.', love: 'Detachment in relationships — sometimes by choice, sometimes by circumstance. Depth of connection matters more than frequency.', health: 'Mysterious or hard-to-diagnose symptoms may arise. Spiritual practices, rest, and unconventional approaches work best.', wealth: 'Financial gains may feel invisible but are accumulating. Avoid speculation; honour whatever is compounding quietly.' },
};

/* ─── HELPERS ─── */
function abbrev(name) {
  const m = { Sun:'Su', Moon:'Mo', Mars:'Ma', Mercury:'Me', Venus:'Ve', Jupiter:'Ju', Saturn:'Sa', Rahu:'Ra', Ketu:'Ke' };
  return m[name] || name.substring(0, 2);
}

function nakDetails(nak) {
  return NAK_DESC[nak] || { essence: 'a unique celestial quality', shadow: 'its characteristic challenge', gift: 'its distinctive strength' };
}

function statBox(label, value) {
  return `<div class="ck-stat"><div class="ck-stat-label">${label}</div><div class="ck-stat-value">${value}</div></div>`;
}

function card(eyebrow, title, body, tone = '') {
  return `<div class="ck-card${tone ? ' ck-card-' + tone : ''}">
    <div class="ck-eyebrow">${eyebrow}</div>
    <h3 class="ck-card-title">${title}</h3>
    <div class="ck-card-body">${body}</div>
  </div>`;
}

function truthStrength(hard, great) {
  return `<div class="ck-ts-grid">
    <div class="ck-ts ck-ts-hard"><div class="ck-ts-label">Hard Truth</div><p>${hard}</p></div>
    <div class="ck-ts ck-ts-great"><div class="ck-ts-label">Great Strength</div><p>${great}</p></div>
  </div>`;
}

function remedy(title, items) {
  return `<div class="ck-remedy">
    <div class="ck-remedy-title">${title}</div>
    <ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>
  </div>`;
}

function tlItem(period, desc, current = false) {
  return `<div class="ck-tl-item">
    <div class="ck-tl-period">${period}${current ? ' <span class="ck-tl-current">current</span>' : ''}</div>
    <div class="ck-tl-desc">${desc}</div>
  </div>`;
}

/* ─── YOGA SECTION ─── */
function yogaSection(yogas) {
  if (!yogas || yogas.length === 0) return '';
  return card(
    'Planetary Yogas Detected',
    'Active Combinations in Your Chart',
    `<p>Yogas are specific planetary configurations that amplify particular life themes. These are active in your birth chart:</p>
    <ul>${yogas.map(y => `<li><strong>${y.name}</strong> — ${y.desc}</li>`).join('')}</ul>`,
    'sage'
  );
}

/* ─── TAB 1: OVERVIEW ─── */
export function generateOverview(d) {
  const { lagnaSign, moonSign, sunSign, lagnaRuler, moonNak, lagnaNak, houseSignNames, planetHouse, planetsLon, yogas } = d;

  const lagnaNakD = nakDetails(lagnaNak);
  const moonNakD = nakDetails(moonNak);
  const moonNakIdx = nakOf(planetsLon.Mo);
  const moonNakPada = nakPada(planetsLon.Mo);
  const lagnaStrength = planetStrength('Ve', planetsLon.Ve || 0) || planetStrength('Ma', planetsLon.Ma || 0) || '';
  const h3ps = ['Su','Mo','Ma','Me','Ve','Ju','Sa','Ra','Ke'].filter(p => planetHouse[p] === 3);

  return `
<div class="ck-hero-line">"${lagnaSign} rising, ${moonSign} Moon, ${lagnaNak} nakshatra — a chart that carries the mark of ${h3ps.length >= 4 ? 'concentrated planetary force' : 'deliberate purpose'}."</div>

${card('The Foundation — Lagna', `${lagnaSign} Ascendant · ${lagnaNak} Nakshatra`,
  `<p>Your rising sign is <strong>${lagnaSign}</strong>, ruled by <strong>${lagnaRuler}</strong>. This is not merely your sun-sign persona — it is how the world encounters you before you speak, how first impressions form, and how your physical body navigates the world. ${lagnaSign} rising means you are ${SIGN_DESC[lagnaSign] || 'a complex and layered soul'}.</p>
  <p>Your Ascendant falls in <strong>${lagnaNak} nakshatra</strong> — the nakshatra of <em>${lagnaNakD.essence}</em>. This is the specific flavour of your Lagna, the quality that makes your ${lagnaSign} rising distinctly yours. Its shadow is ${lagnaNakD.shadow}; its gift is ${lagnaNakD.gift}.</p>`
)}

${card('The Foundation — Moon', `Moon in ${moonSign} · ${moonNak} Nakshatra, Pada ${moonNakPada}`,
  `<p>Your Moon sits in <strong>${moonSign}</strong>${moonSign === lagnaSign ? ' — the same sign as your Ascendant, creating a powerful alignment between your emotional nature and your outward identity' : ', a placement that colours your instincts, memory, and emotional processing with the qualities of ' + moonSign}. The Moon in your chart governs not just feelings but your entire subconscious orientation — the lens through which raw experience becomes memory.</p>
  <p>In <strong>${moonNak} nakshatra</strong> (Pada ${moonNakPada}, presided over by ${d.moonNakDeity || 'the cosmic force of this nakshatra'}), your inner world carries the essence of <em>${moonNakD.essence}</em>. Its shadow is the risk of ${moonNakD.shadow}. Its gift — when consciously cultivated — is ${moonNakD.gift}.</p>
  <p>The soul work described by this Moon placement is the deliberate movement from shadow toward gift: not as a single decision, but as a recurring daily practice of noticing which direction the energy is flowing.</p>`,
  'rose'
)}

${h3ps.length >= 3 ? card('The Signature Stellium', `${h3ps.length} Planets in House 3 — ${houseSignNames[3]}`,
  `<p>Your 3rd house — the house of courage, communication, skill, siblings, and self-made effort — holds <strong>${h3ps.map(p => PNAME[p] || p).join(', ')}</strong>. This is one of the most significant features of your chart: an enormous concentration of life-force in the domain of the voice, the hand, and the nerve.</p>
  <p>Very little in this chart is passive. Almost everything routes through what you say, what you make, what you dare. The opportunity is formidable; the responsibility is to channel rather than scatter. A stellium this concentrated demands conscious direction — without it, the energy can become chaotic or all-consuming; with it, it becomes a command centre.</p>`,
  'sage'
) : ''}

${yogaSection(yogas)}
`;
}

/* ─── TAB 2: CAREER ─── */
export function generateCareer(d) {
  const { lagnaSign, houseSignNames, planetHouse, planetsLon, dashas, currentDasha, nextDasha } = d;
  const h10 = houseSignNames[10];
  const h10Lord = RULERS[ZODIAC.indexOf(h10)];
  const h10LordH = planetHouse[abbrev(h10Lord)] || 1;
  const h6 = houseSignNames[6];
  const h6Lord = RULERS[ZODIAC.indexOf(h6)];
  const cd = currentDasha;
  const nd = nextDasha;
  const careerNote = cd ? DASHA_NOTES[cd.planet]?.career : '';
  const nextNote = nd ? DASHA_NOTES[nd.planet]?.career : '';

  return `
<div class="ck-hero-line">"The chart does not hand you a career. It shows you the domain in which your effort compounds fastest."</div>

<div class="ck-stat-row">
  ${statBox('10th House', h10)}
  ${statBox('10th Lord', h10Lord)}
  ${statBox(`${h10Lord} sits in`, `House ${h10LordH}`)}
</div>

${card('Career Foundation', `The 10th House & Its Lord`,
  `<p>Your 10th house of career and public reputation falls in <strong>${h10}</strong>. Its ruler, <strong>${h10Lord}</strong>, sits in your ${ordinal(h10LordH)} house — the house of <em>${['Self & Personality','Wealth & Family','Courage & Communication','Home & Mother','Creativity & Children','Health & Service','Partnership & Marriage','Transformation','Dharma & Fortune','Career & Status','Gains & Network','Liberation'][h10LordH - 1]}</em>. This positioning shapes <em>how</em> your career energy naturally flows and which life domain it draws from.</p>
  <p>Careers naturally suited to ${h10}: <em>${CAREER_Q[h10] || 'fields that reward your particular combination of qualities'}</em>.</p>`
)}

${card('Skill & Courage', `House 3 — ${houseSignNames[3]} — The Engine of Your Work`,
  `<p>The 3rd house of skill, courage, and earned effort is in <strong>${houseSignNames[3]}</strong>. This house represents what you actively develop through practice — the domain of competence-building that most reliably converts effort into recognition. Any planets in your 3rd house are the primary engines of your professional skill set.</p>
  <p>The 6th house of service and routine health falls in <strong>${h6}</strong>, ruled by <strong>${h6Lord}</strong>. How you manage daily routines, adversaries, and competitive environments is coloured by this sign — ${SIGN_DESC[h6] || 'a quality that shapes your professional stamina'} in your daily working life.</p>`,
  'rose'
)}

${truthStrength(
  'Your ambition and your confidence are not the same number — there is a gap, and that gap is costing you rooms, raises, and opportunities you are technically qualified for. The chart shows more capability than your inner narrative credits.',
  `${h10Lord} governing your career from house ${h10LordH} creates a slow-build professional signature — one that compounds year over year into genuine authority. The architecture is sound; what it requires is time and the willingness to let reputation precede you.`
)}

${card('Career Timing', 'The Time Stream — Dasha Windows',
  `<div class="ck-timeline">
    ${cd ? tlItem(`Now → ${fmtYM(cd.end)}`, `<strong>${PNAME[cd.planet]} Mahadasha</strong> — ${careerNote || 'follow the natural energy of this planetary period'}.`, true) : ''}
    ${nd ? tlItem(`${fmtYM(nd.start)} → ${fmtYM(nd.end)}`, `<strong>${PNAME[nd.planet]} Mahadasha</strong> begins — ${nextNote || 'a new chapter of career development opens'}.`) : ''}
  </div>`,
  'sage'
)}

${remedy('Career Upayas', [
  `Honour your 10th lord <strong>${h10Lord}</strong>: ${PLANET_UPAYA[abbrev(h10Lord)] || 'observe the planet\'s natural day with a consistent act aligned to its energy'}.`,
  'Build one non-negotiable weekly review ritual — a fixed day and time to assess what you are building and what deserves more attention.',
  'Before high-stakes presentations or pitches: 10 minutes of slow, deliberate breathing grounds the nervous system more reliably than additional preparation.',
])}
`;
}

/* ─── TAB 3: LOVE ─── */
export function generateLove(d) {
  const { lagnaSign, houseSignNames, planetHouse, planetsLon, currentDasha } = d;
  const h7 = houseSignNames[7];
  const h7Lord = RULERS[ZODIAC.indexOf(h7)];
  const h7LordH = planetHouse[abbrev(h7Lord)] || 1;
  const venH = planetHouse['Ve'] || 1;
  const venSign = houseSignNames[venH];
  const venStrength = planetStrength('Ve', planetsLon.Ve || 0);
  const marsStrength = planetStrength('Ma', planetsLon.Ma || 0);
  const cd = currentDasha;
  const loveNote = cd ? DASHA_NOTES[cd.planet]?.love : '';

  const VENUS_HOUSE_NOTE = {
    1: 'Venus in the 1st house makes your personality itself magnetic — love, beauty, and charm are inseparable from your identity. You are naturally attractive and may not fully realise the effect you have.',
    2: 'Venus in the house of wealth and speech makes love inseparable from security. You attract through your voice, your values, and the warmth of what you have built. Family and partnership are deeply intertwined.',
    3: 'Venus in the 3rd makes love a function of communication and creative connection. Intellectual spark and artistic resonance matter enormously — a partner who cannot match your mind rarely holds your heart.',
    4: 'Venus in the 4th places love at the heart of the home. You love most deeply in domestic settings, in shared rituals, in the building of a life rather than the performance of romance.',
    5: 'Venus in the 5th makes love vivid, dramatic, and creative. Romantic experiences are a central creative act — this placement loves deeply, falls hard, and creates beauty from every connection.',
    6: 'Venus in the 6th means love is expressed most authentically through service and devotion. You show up for people in practical ways; for you, care is an act, not a declaration.',
    7: 'Venus in the 7th is a classic placement for significant partnership. Love is a central life theme — this placement genuinely thrives in committed, equal relationships where both people contribute fully.',
    8: 'Venus in the 8th means love is transformative, intense, and always pushing toward the depths. Nothing is surface-level here. Relationships are experiences that change you fundamentally.',
    9: 'Venus in the 9th seeks love that expands the mind and soul. Partners who are wise, foreign, philosophically rich, or deeply principled are specifically attractive — and sustaining.',
    10: 'Venus in the 10th entangles love with public life and career. Partners often share your professional world; your reputation and your romantic life have a way of reflecting each other.',
    11: 'Venus in the 11th finds love through friendship and shared vision. Your deepest romantic connections begin as genuine friendships — the intellectual and social bond precedes the romantic one.',
    12: 'Venus in the 12th lives in the private, the hidden, and the spiritual. The most meaningful connections often begin in unusual circumstances, and your richest romantic experiences may be invisible to the world.',
  };

  return `
<div class="ck-hero-line">"For ${lagnaSign} rising, love is not a peripheral experience — it is a central one, and it runs deep."</div>

<div class="ck-stat-row">
  ${statBox('7th House', h7)}
  ${statBox('7th Lord', h7Lord)}
  ${statBox('Venus sits in', `House ${venH} · ${venSign}`)}
</div>

${card('Partnership Foundation', `The 7th House — ${h7}`,
  `<p>Your 7th house of marriage and committed partnership falls in <strong>${h7}</strong>. The qualities that sustain you in a relationship — and the qualities you most need in a partner — are shaped by this sign: <em>${LOVE_Q[h7] || 'a deep, soulful presence that meets you at the level of genuine commitment'}</em>.</p>
  <p>The 7th lord, <strong>${h7Lord}</strong>, sits in your ${ordinal(h7LordH)} house — the house of <em>${['Self & Personality','Wealth & Family','Courage & Communication','Home & Mother','Creativity & Children','Health & Service','Partnership & Marriage','Transformation','Dharma & Fortune','Career & Status','Gains & Network','Liberation'][h7LordH - 1]}</em>. This tells us that partnership energy in your chart is experienced through that domain — it is where love's themes intersect with that house's themes.</p>`
)}

${card('Venus — The Karaka of Love', 'Venus in House ' + venH + ' · ' + venSign + (venStrength ? ' · ' + venStrength.charAt(0).toUpperCase() + venStrength.slice(1) : ''),
  (function() {
    let venBody = `<p>${VENUS_HOUSE_NOTE[venH] || 'Venus colours this domain with charm, beauty, and a desire for harmony and connection.'}</p>`;
    if (venStrength === 'exalted') {
      venBody += `<p>Venus is currently <strong>exalted</strong> in your chart — its most powerful expression, gifting you with unusual charm, artistic sense, and the capacity for deep and sustaining love.</p>`;
    } else if (venStrength === 'debilitated') {
      venBody += `<p>Venus is currently <strong>debilitated</strong> in your chart — a placement that points to the primary area of growth in your romantic life; the lessons here are specific and, when integrated, become real wisdom about connection.</p>`;
    } else if (venStrength === 'own') {
      venBody += `<p>Venus sits in its <strong>own sign</strong> — comfortable in its own energy, gifting you with a natural ease in love and aesthetics.</p>`;
    }
    return venBody;
  })(),
  'rose'
)}

${truthStrength(
  `Because your 7th lord (${h7Lord}) sits in house ${h7LordH} rather than the 7th itself, the energy of partnership is coloured by that house's themes — meaning relationship dynamics can unconsciously absorb those themes. Watch for patterns where love becomes entangled with that domain in ways that don't serve either person.`,
  'Your Moon\'s emotional intelligence — fully developed — makes you the partner who reads unspoken needs, shows up when it counts, and remembers what matters. That is not common, and it is specifically available to you as a cultivated strength rather than a natural default.'
)}

${card('Relationship Timing', 'Current Dasha & Love',
  `<p><strong>${cd ? PNAME[cd.planet] : 'Current'} Mahadasha:</strong> ${loveNote || 'The energy of the current planetary period colours your romantic experiences and opportunities. Work with this energy rather than against it.'}</p>`,
  'sage'
)}

${remedy('Relationship Upayas', [
  `For your 7th lord <strong>${h7Lord}</strong>: ${PLANET_UPAYA[abbrev(h7Lord)] || 'observe the planet\'s day with an act that honours its energy'}.`,
  'Keep a private journal for the feelings you are tempted to manage in a partner rather than name out loud. The gap between what you feel and what you express is where most partnership friction lives.',
  'Before difficult conversations: a short, physical movement practice (a walk, five minutes of stretching) discharges reactive charge before it reaches your words.',
])}
`;
}

/* ─── TAB 4: HEALTH ─── */
export function generateHealth(d) {
  const { lagnaSign, houseSignNames, planetHouse, planetsLon, currentDasha } = d;
  const h6 = houseSignNames[6];
  const h6Lord = RULERS[ZODIAC.indexOf(h6)];
  const h8 = houseSignNames[8];
  const bf = BODY_FOCUS[lagnaSign] || 'Whole System';
  const stress = HEALTH_STRESS[lagnaSign] || 'The body speaks through its most sensitive zone when the mind is overloaded.';
  const exercise = EXERCISE_NOTE[lagnaSign] || 'Regular, moderate movement outperforms extremes for your constitution.';
  const cd = currentDasha;
  const healthNote = cd ? DASHA_NOTES[cd.planet]?.health : '';

  return `
<div class="ck-hero-line">"Your body keeps the diary your mind refuses to write. Learn to read it before it raises its voice."</div>

<div class="ck-stat-row">
  ${statBox('6th House', h6)}
  ${statBox('6th Lord', h6Lord)}
  ${statBox('Body Focus', bf)}
</div>

${card('Constitution', `${lagnaSign} Rising — Body Architecture`,
  `<p><strong>${lagnaSign} rising</strong> maps the physical body to the domain of <strong>${bf}</strong> — these are the zones that carry the most karmic sensitivity in this lifetime. This doesn't mean they are inevitably problematic; it means they are the earliest indicators when the system is out of balance, and the most rewarding to consciously cultivate.</p>
  <p>Your 6th house of daily health, service, and immune function falls in <strong>${h6}</strong>, governed by <strong>${h6Lord}</strong>. The condition and placement of ${h6Lord} in your chart reveals whether daily health maintenance comes easily or demands conscious effort.</p>
  <p>The 8th house of chronic conditions, longevity, and regeneration falls in <strong>${h8}</strong> — the energy of this sign shapes how your body responds to deep healing, surgery, and long-term structural restoration.</p>`
)}

${card('Stress Architecture', 'Where This Body Holds Tension',
  `<p>${stress}</p>
  <p>The pattern to watch: your health challenges, when they arrive, rarely begin as purely physical events. They tend to carry an emotional or mental signature first — a suppression, an avoidance, a sustained effort not to feel something. Learning to read the early signals in your <strong>${bf.toLowerCase()}</strong> is the primary preventive medicine available to you.</p>`,
  'rose'
)}

${truthStrength(
  `Chronic stress has a specific address in your body: <strong>${bf.toLowerCase()}</strong>. The longer the suppression, the more specific the location. This is not punishment — it is signal. The body is always trying to communicate before it escalates.`,
  EXERCISE_NOTE[lagnaSign]?.includes('swim') || lagnaSign === 'Cancer'
    ? 'Water is your most powerful physical medicine — swimming, baths, proximity to water — not as metaphor but as literal physiological regulation. Use it deliberately.'
    : 'Repetitive, sensory, and consistent physical rituals work as unusually powerful regulators for your nervous system. The same walk, the same practice, the same grounding act — consistency is the medicine.'
)}

${card('Current Period Health Note', `${cd ? PNAME[cd.planet] : 'Current'} Mahadasha`,
  `<p>${healthNote || 'Work with the energy of your current planetary period to understand where to place health focus. Each dasha period activates different physiological themes.'}</p>`,
  'sage'
)}

${remedy('Vitality Upayas', [
  'Build one immovable daily ritual — same wake time, same short movement or breath practice. Your Lagna heals through repetition and sensory consistency, not novelty.',
  'A 10-minute brain-dump journaling practice before bed empties racing thoughts rather than carrying them into sleep, where they generate low-grade physiological stress throughout the night.',
  exercise,
])}
`;
}

/* ─── TAB 5: WEALTH ─── */
export function generateWealth(d) {
  const { lagnaSign, houseSignNames, planetHouse, planetsLon, currentDasha, nextDasha } = d;
  const h2 = houseSignNames[2];
  const h11 = houseSignNames[11];
  const h2Lord = RULERS[ZODIAC.indexOf(h2)];
  const h2LordH = planetHouse[abbrev(h2Lord)] || 1;
  const h11ps = ['Su','Mo','Ma','Me','Ve','Ju','Sa','Ra','Ke'].filter(p => planetHouse[p] === 11);
  const h2ps = ['Su','Mo','Ma','Me','Ve','Ju','Sa','Ra','Ke'].filter(p => planetHouse[p] === 2);
  const cd = currentDasha;
  const nd = nextDasha;
  const wealthNote = cd ? DASHA_NOTES[cd.planet]?.wealth : '';

  return `
<div class="ck-hero-line">"Wealth in your chart is not a lottery result — it is a craft, and the chart shows exactly which craft it is."</div>

<div class="ck-stat-row">
  ${statBox('2nd House', h2)}
  ${statBox('11th House', h11)}
  ${statBox('2nd House', h2ps.length ? h2ps.map(p => PNAME[p]).join(' + ') : 'Empty')}
</div>

${card('The Wealth Foundation', `2nd House — ${h2} — Artha`,
  `<p>Your 2nd house of accumulated wealth, speech, and family resources falls in <strong>${h2}</strong>. The income you generate is closely tied to the qualities of this sign — and specifically to how its ruler, <strong>${h2Lord}</strong>, is placed in your chart. ${h2Lord} in house ${h2LordH} means wealth energy flows through the domain of <em>${['Self & Personality','Wealth & Family','Courage & Communication','Home & Mother','Creativity & Children','Health & Service','Partnership & Marriage','Transformation','Dharma & Fortune','Career & Status','Gains & Network','Liberation'][h2LordH - 1]}</em>.</p>
  ${h2ps.length > 0 ? `<p>Your 2nd house holds <strong>${h2ps.map(p => PNAME[p]).join(' and ')}</strong> — ${h2ps.includes('Ju') && h2ps.includes('Sa') ? 'the combination of Jupiter (expansion and judgment) and Saturn (discipline and structure) in the wealth house is one of the most classically favourable signatures for compounding, long-term financial stability' : h2ps.includes('Ju') ? 'Jupiter here is a classic wealth-house blessing, gifting the potential for genuine abundance through judgment and generosity' : h2ps.includes('Sa') ? 'Saturn here demands patience but rewards consistency with a financial structure that outlasts boom-and-bust cycles' : 'these planets colour how wealth accumulates and what relationship you have with resources and what they mean to you'}.</p>` : '<p>With no planets occupying the 2nd house directly, your wealth is governed entirely by the condition of the 2nd lord in its house — this is a focused rather than dispersed pattern.</p>'}
`)}

${card('The Gains Network', `11th House — ${h11} — Future Income`,
  `<p>Your 11th house of gains, aspirations, and the income that flows through your network and long-term goals falls in <strong>${h11}</strong>. ${WEALTH_H11[h11] || 'Gains follow the energy of this sign\'s deepest qualities'}.</p>
  ${h11ps.length > 0 ? `<p><strong>${h11ps.map(p => PNAME[p]).join(', ')}</strong> in the 11th house colour how abundance arrives — through the specific qualities and drives of these planets.</p>` : ''}`,
  'rose'
)}

${truthStrength(
  'The gap between what you earn and what you keep deserves more attention than the gap between what you currently earn and what you want to earn. Impulse spending — especially during emotionally heightened periods — can quietly undermine the compounding this chart is built for.',
  'Your chart is architecturally sound for wealth that compounds slowly and holds over time. The foundation is there; what it requires is patience, automation of good habits, and a resistance to chasing speed at the cost of structure.'
)}

${card('Wealth Timing', 'Dasha Windows for Financial Growth',
  `<div class="ck-timeline">
    ${cd ? tlItem(`Now → ${fmtYM(cd.end)}`, `<strong>${PNAME[cd.planet]} Mahadasha:</strong> ${wealthNote || 'Work with this period\'s energy for financial decisions.'}`, true) : ''}
    ${nd ? tlItem(`${fmtYM(nd.start)} → ${fmtYM(nd.end)}`, `<strong>${PNAME[nd.planet]} Mahadasha</strong> begins — ${DASHA_NOTES[nd.planet]?.wealth || 'a new chapter of financial development opens'}.`) : ''}
  </div>`,
  'sage'
)}

${remedy('Wealth Upayas', [
  'Automate savings on payday — before the money is psychologically "available." This routes around impulse patterns without requiring willpower to fight them every cycle.',
  'Before any investment that feels urgent, exciting, or particularly compelling: impose a 3-full-day waiting period. The urgency is almost always artificial; the decision quality is always better with distance.',
  `Thursdays: a small, consistent act of generosity or dedicated learning (20 minutes of financial study). This strengthens Jupiter's naturally wealth-supporting energy in any chart.`,
])}
`;
}
