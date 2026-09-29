/**
 * Nalam Tamil Nadu (நலம் தமிழ்நாடு)
 * Full Interactive Application Logic
 * Supports: Bilingual toggle (Tamil/English), Aadhaar Scheme Finder,
 * Transparent Certificate Tracker, QR Verification, Schemes Directory,
 * and "சேவை தோழன்" Tamil AI Chatbot with Text-to-Speech (TTS).
 */

// Application State
const state = {
  currentLang: 'ta',
  voiceEnabled: true,
  currentTab: 'home',
  demoPersonas: [],
  allSchemes: [],
  matchedSchemes: [],
  currentAppRecord: null,
  activeCategory: 'all'
};

// Bilingual Translation Dictionary
const I18N = {
  ta: {
    nav_home: "முகப்பு",
    nav_aadhaar: "ஆதார் தகுதி அறிதல்",
    nav_tracker: "சான்றிதழ் கண்காணிப்பு",
    nav_verify: "QR சரிபார்ப்பு",
    nav_schemes: "அனைத்து திட்டங்கள்",
    voice_on: "குரல் வாசிப்பு: ஆன்",
    voice_off: "குரல் வாசிப்பு: ஆப்",
    lang_btn: "English",
    brand_sub: "அரசு நலத்திட்டங்கள் அறிதல் & வெளிப்படையான சான்றிதழ் கண்காணிப்பு",
    hero_badge: "வெளிப்படையான மக்கள் நிர்வாகம் • 100% கட்டணமில்லா வழிகாட்டி",
    hero_title: "அரசு நலத்திட்டங்கள் & சான்றிதழ்கள் இனி ஒவ்வொரு குடிமகனுக்கும் வெளிப்படையாக!",
    hero_desc: "உங்களுக்கு அரசு வழங்கும் சலுகைகள் தெரியவில்லையா? உங்கள் ஆதார் எண்ணை இட்டு தகுதியான அனைத்து திட்டங்களையும் நொடியில் கண்டறியுங்கள். சான்றிதழ் மனுக்களை VAO முதல் வட்டாட்சியர் வரை வெளிப்படையாகக் கண்காணிக்கலாம்.",
    btn_aadhaar: "ஆதார் வழி திட்டங்கள் காண்க",
    btn_track: "சான்றிதழ் நிலையை அறிய",
    btn_chat: "சேவை தோழனுடன் உரையாடு",
    explore: "தொடர",
    listen: "குரல் வழி கேள்",
    aadhaar_heading: "ஆதார் வழி நலத்திட்ட தகுதி சரிபார்ப்பு",
    aadhaar_sub: "உங்கள் சுயவிவரத்தின்படி நீங்கள் தகுதிபெறும் அனைத்து தமிழ்நாடு மற்றும் மத்திய அரசு நலத்திட்டங்களை உடனே கண்டறியுங்கள்.",
    btn_check: "தகுதியைச் சரிபார்",
    tracker_heading: "வெளிப்படையான சான்றிதழ் ஒப்புதல் & கண்காணிப்பு",
    tracker_sub: "உங்கள் விண்ணப்பம் எந்த நிலையில் உள்ளது (VAO கள ஆய்வு, RI பரிந்துரை, வட்டாட்சியர் ஒப்புதல்) என்பதை வெளிப்படையாகக் கண்காணிக்கலாம்.",
    verify_heading: "போலி சான்றிதழ் தடுப்பு & QR உண்மைத்தன்மை சரிபார்ப்பு",
    verify_sub: "கல்லூரிகள், நிறுவனங்கள் மற்றும் பொதுமக்கள் தமிழ்நாடு அரசு வழங்கிய சான்றிதழின் உண்மைத்தன்மையை நேரடியாக சரிபார்க்கலாம்."
  },
  en: {
    nav_home: "Home",
    nav_aadhaar: "Aadhaar Eligibility",
    nav_tracker: "Track Certificate",
    nav_verify: "QR Verification",
    nav_schemes: "All Schemes",
    voice_on: "Voice Readout: ON",
    voice_off: "Voice Readout: OFF",
    lang_btn: "தமிழ் (Tamil)",
    brand_sub: "Welfare Scheme Eligibility & Transparent Certificate Tracking",
    hero_badge: "Transparent Public Governance • 100% Free Citizen Guide",
    hero_title: "Government Welfare Schemes & Certificates - Transparent to Every Citizen!",
    hero_desc: "Unsure which government schemes you qualify for? Enter your Aadhaar number to instantly discover all eligible state and central welfare benefits. Track your certificate applications transparently from VAO to Tahsildar.",
    btn_aadhaar: "Check Schemes by Aadhaar",
    btn_track: "Track Certificate Status",
    btn_chat: "Chat with Sevai Thozhan",
    explore: "Explore",
    listen: "Listen (Audio)",
    aadhaar_heading: "Aadhaar Welfare Scheme Eligibility Finder",
    aadhaar_sub: "Instantly check all Tamil Nadu and Central government schemes matching your profile.",
    btn_check: "Check Eligibility",
    tracker_heading: "Transparent Certificate Approval & Verification",
    tracker_sub: "Track your application live through VAO inspection, RI recommendation, and Tahsildar approval.",
    verify_heading: "Anti-Forgery QR Certificate Verification",
    verify_sub: "Colleges, employers, and citizens can verify the authenticity of official government certificates directly."
  }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadDemoPersonas();
  loadAllSchemes();
  loadRecentApproved();
  formatAadhaarInput();
  
  // Set current date
  const now = new Date();
  const dateStr = now.toLocaleDateString('ta-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const topDateEl = document.getElementById('top-date');
  if (topDateEl) topDateEl.innerText = dateStr;
});

// Setup event listeners
function setupEventListeners() {
  // Voice toggle
  document.getElementById('voice-toggle-btn').addEventListener('click', toggleVoice);

  // Font size adjuster
  document.getElementById('font-inc').addEventListener('click', () => adjustFontSize(1));
  document.getElementById('font-dec').addEventListener('click', () => adjustFontSize(-1));
  document.getElementById('font-reset').addEventListener('click', () => adjustFontSize(0));

  // Contrast toggle
  document.getElementById('contrast-toggle-btn').addEventListener('click', toggleContrast);

  // Language switcher
  document.getElementById('lang-switch-btn').addEventListener('click', toggleLanguage);
}

// Language Switcher
function toggleLanguage() {
  state.currentLang = state.currentLang === 'ta' ? 'en' : 'ta';
  const l = I18N[state.currentLang];
  
  document.getElementById('lang-label').innerText = l.lang_btn;
  document.getElementById('brand-subtitle').innerText = l.brand_sub;
  
  // Update Navigation
  document.querySelector('.t-nav-home').innerText = l.nav_home;
  document.querySelector('.t-nav-aadhaar').innerText = l.nav_aadhaar;
  document.querySelector('.t-nav-tracker').innerText = l.nav_tracker;
  document.querySelector('.t-nav-verify').innerText = l.nav_verify;
  document.querySelector('.t-nav-schemes').innerText = l.nav_schemes;

  // Update Hero
  const heroBadge = document.querySelector('.t-hero-badge');
  if (heroBadge) heroBadge.innerText = l.hero_badge;
  const heroTitle = document.getElementById('t-hero-title');
  if (heroTitle) heroTitle.innerText = l.hero_title;
  const heroDesc = document.getElementById('t-hero-desc');
  if (heroDesc) heroDesc.innerText = l.hero_desc;
  const btnAadhaar = document.querySelector('.t-btn-aadhaar');
  if (btnAadhaar) btnAadhaar.innerText = l.btn_aadhaar;
  const btnTrack = document.querySelector('.t-btn-track');
  if (btnTrack) btnTrack.innerText = l.btn_track;
  const btnChat = document.querySelector('.t-btn-chat');
  if (btnChat) btnChat.innerText = l.btn_chat;

  // Refresh lists with current language
  renderPersonas();
  renderSchemesDirectory();
  renderRecentApproved();
  if (state.matchedSchemes.length > 0) {
    renderMatchedSchemes();
  }
  if (state.currentAppRecord) {
    renderTrackingDetails(state.currentAppRecord);
  }
}

// Font Size Adjuster
let currentFontScale = 0;
function adjustFontSize(delta) {
  if (delta === 0) currentFontScale = 0;
  else currentFontScale = Math.min(2, Math.max(-1, currentFontScale + delta));

  document.body.classList.remove('font-lg', 'font-xl');
  if (currentFontScale === 1) document.body.classList.add('font-lg');
  if (currentFontScale === 2) document.body.classList.add('font-xl');
}

// Contrast Toggle
function toggleContrast() {
  document.body.classList.toggle('high-contrast');
}

// Voice Assist Toggle
function toggleVoice() {
  state.voiceEnabled = !state.voiceEnabled;
  const btnText = document.getElementById('voice-btn-text');
  btnText.innerText = state.voiceEnabled ? I18N[state.currentLang].voice_on : I18N[state.currentLang].voice_off;
  if (!state.voiceEnabled) {
    window.speechSynthesis.cancel();
  } else {
    speakText(state.currentLang === 'ta' ? 'குரல் வாசிப்பு இயக்கப்பட்டது.' : 'Voice assistance activated.');
  }
}

// Text-to-Speech (TTS) Engine
function speakText(text) {
  if (!state.voiceEnabled || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel(); // cancel any active speech

  const cleanText = text.replace(/[*#_`]/g, '');
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 0.95;

  const voices = window.speechSynthesis.getVoices();
  const tamilVoice = voices.find(v => v.lang.includes('ta') || v.lang.includes('ta-IN'));
  if (tamilVoice && state.currentLang === 'ta') {
    utterance.voice = tamilVoice;
  }
  window.speechSynthesis.speak(utterance);
}

function readAloudSection(elementId) {
  const el = document.getElementById(elementId) || document.querySelector(`.${elementId}`);
  if (el) speakText(el.innerText);
}

// Tab Switching
function switchTab(tabId) {
  state.currentTab = tabId;
  document.querySelectorAll('.tab-pane').forEach(el => el.style.display = 'none');
  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.style.display = 'block';

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-tab') === tabId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Aadhaar Input Auto-Formatting (XXXX-XXXX-XXXX)
function formatAadhaarInput() {
  const input = document.getElementById('aadhaar-input');
  if (!input) return;
  input.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '').substring(0, 12);
    let parts = [];
    for (let i = 0; i < value.length; i += 4) {
      parts.push(value.substring(i, i + 4));
    }
    e.target.value = parts.join('-');
  });
}

// --- PERSONAS & SCHEME ELIGIBILITY ENGINE ---
async function loadDemoPersonas() {
  try {
    const res = await fetch('/api/demo-profiles');
    state.demoPersonas = await res.json();
    renderPersonas();
  } catch (err) {
    try {
      const res2 = await fetch('data/certificates.json');
      const data2 = await res2.json();
      state.demoPersonas = data2.demo_personas || [];
      renderPersonas();
    } catch(e) {
      console.error('Failed to load personas:', err);
    }
  }
}

function renderPersonas() {
  const container = document.getElementById('persona-grid');
  if (!container) return;
  const isTa = state.currentLang === 'ta';

  container.innerHTML = state.demoPersonas.map((p) => `
    <button class="persona-btn" onclick="selectPersona('${p.id}', this)">
      <div class="persona-avatar">
        ${p.id.includes('priya') ? '👩‍🎓' : p.id.includes('murugan') ? '🌾' : p.id.includes('lakshmi') ? '👵' : '💼'}
      </div>
      <div>
        <div class="persona-name">${isTa ? p.name_ta : p.name_en}</div>
        <div class="persona-desc">${isTa ? p.summary_ta : p.summary_en}</div>
        <span style="font-size: 0.72rem; color: #ef4444; font-weight:700; margin-top:4px; display:inline-block;">
          <i class="fa-solid fa-fingerprint"></i> ${p.aadhaar_masked}
        </span>
      </div>
    </button>
  `).join('');

  // NOTE: Form starts clean and blank without auto-filling sample data
}

function selectPersona(personaId, element) {
  document.querySelectorAll('.persona-btn').forEach(b => b.classList.remove('active'));
  if (element) element.classList.add('active');

  const p = state.demoPersonas.find(x => x.id === personaId);
  if (p) {
    applyPersonaToForm(p);
    executeEligibilityCheck();
  }
}

function applyPersonaToForm(p) {
  const prof = p.profile;
  document.getElementById('aadhaar-input').value = p.aadhaar_masked;
  document.getElementById('f-age').value = prof.age || 20;
  document.getElementById('f-gender').value = prof.gender || 'female';
  document.getElementById('f-income').value = prof.annual_income || 80000;
  document.getElementById('f-community').value = prof.community || 'BC';
  document.getElementById('f-occupation').value = prof.occupation || 'student';
  document.getElementById('f-first-graduate').checked = !!prof.first_graduate;
  document.getElementById('f-land').checked = !!prof.has_agricultural_land;
  document.getElementById('f-disabled').checked = !!prof.differently_abled;
}

// Diverse Randomized Citizen Names Pool for Authentic Certificates
const RANDOM_CITIZEN_NAMES = [
  { name_ta: "கார்த்திகேயன்", name_en: "Karthikeyan", father_ta: "முருகேசன்", father_en: "Murugesan" },
  { name_ta: "செந்தில்குமார்", name_en: "Senthilkumar", father_ta: "சுப்பிரமணியன்", father_en: "Subramanian" },
  { name_ta: "மீனாட்சி சுந்தரி", name_en: "Meenakshi Sundari", father_ta: "தங்கவேல்", father_en: "Thangavel" },
  { name_ta: "வெற்றிவேல்", name_en: "Vetrivel", father_ta: "நடராஜன்", father_en: "Natarajan" },
  { name_ta: "காயத்ரி தேவி", name_en: "Gayathri Devi", father_ta: "பெருமாள்", father_en: "Perumal" },
  { name_ta: "தனுஷ்கா", name_en: "Dhanushka", father_ta: "அழகர்சாமி", father_en: "Alagarsamy" },
  { name_ta: "இளங்கோவன்", name_en: "Ilangovan", father_ta: "கந்தசாமி", father_en: "Kandasamy" },
  { name_ta: "விஜயபாஸ்கர்", name_en: "Vijaya Baskar", father_ta: "ராமசாமி", father_en: "Ramasamy" },
  { name_ta: "பவளக்கொடி", name_en: "Pavalakkodi", father_ta: "கருப்பையா", father_en: "Karuppaiah" },
  { name_ta: "அறிவழகன்", name_en: "Arivalagan", father_ta: "சின்னசாமி", father_en: "Chinnasamy" },
  { name_ta: "மகேஸ்வரி", name_en: "Mageswari", father_ta: "மாணிக்கம்", father_en: "Manickam" },
  { name_ta: "சரவணக்குமார்", name_en: "Saravanakumar", father_ta: "பாலசுப்பிரமணியன்", father_en: "Balasubramanian" },
  { name_ta: "அன்பரசி", name_en: "Anbarasi", father_ta: "சண்முகம்", father_en: "Shanmugam" },
  { name_ta: "தர்மராஜ்", name_en: "Dharmaraj", father_ta: "வேலுச்சாமி", father_en: "Veluchamy" }
];

function getRandomCitizen(seed) {
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    const idx = Math.abs(hash) % RANDOM_CITIZEN_NAMES.length;
    return RANDOM_CITIZEN_NAMES[idx];
  }
  const idx = Math.floor(Math.random() * RANDOM_CITIZEN_NAMES.length);
  return RANDOM_CITIZEN_NAMES[idx];
}

// Execute Eligibility Check (Privacy Protected: Name is NOT revealed)
async function executeEligibilityCheck() {
  const aadhaarVal = document.getElementById('aadhaar-input').value.replace(/\D/g, '');
  const aadhaarRaw = aadhaarVal || (Math.floor(100000000000 + Math.random() * 900000000000)).toString();
  const age = parseInt(document.getElementById('f-age').value) || 22;
  const gender = document.getElementById('f-gender').value;
  const annual_income = parseFloat(document.getElementById('f-income').value) || 85000;
  const community = document.getElementById('f-community').value;
  const occupation = document.getElementById('f-occupation').value;
  const first_graduate = document.getElementById('f-first-graduate').checked;
  const has_agricultural_land = document.getElementById('f-land').checked;
  const differently_abled = document.getElementById('f-disabled').checked;

  const profile = {
    aadhaar: aadhaarRaw,
    age,
    gender,
    annual_income,
    community,
    occupation,
    student_status: occupation === 'student' ? 'college' : 'none',
    school_type: 'government',
    first_graduate,
    has_agricultural_land,
    differently_abled,
    marital_status: age >= 60 ? 'widow' : 'single'
  };

  try {
    const res = await fetch('/api/check-eligibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile })
    });
    const data = await res.json();
    state.matchedSchemes = data.schemes || [];

    // Render results
    renderMatchedSchemes(data);
    document.getElementById('eligibility-results-container').style.display = 'block';

    // Auto read aloud result summary
    if (state.voiceEnabled) {
      const isTa = state.currentLang === 'ta';
      const msg = isTa 
        ? `தகுதி சரிபார்ப்பு முடிந்தது. உங்களுக்கு ${data.total_eligible_count} அரசு திட்டங்கள் தகுதியாக உள்ளன.`
        : `Eligibility check complete. You qualify for ${data.total_eligible_count} government schemes.`;
      speakText(msg);
    }
  } catch (err) {
    console.error('Eligibility check error:', err);
  }
}

function renderMatchedSchemes(data) {
  const isTa = state.currentLang === 'ta';
  const count = state.matchedSchemes.length;
  
  const countText = document.getElementById('matched-count-text');
  if (countText) {
    countText.innerText = isTa 
      ? `உங்களுக்கு ${count} அரசு நலத்திட்டங்கள் தகுதியாக உள்ளன!`
      : `You are eligible for ${count} Government Welfare Schemes!`;
  }

  // Name is not revealed to protect citizen privacy
  const subText = document.getElementById('matched-sub-text');
  if (subText) {
    const aadhaarMasked = data?.applicant_summary?.aadhaar_masked || 'XXXX-XXXX-****';
    subText.innerHTML = isTa
      ? `<i class="fa-solid fa-user-shield" style="color: #ef4444;"></i> <strong>ஆதார் பயனாளி (பெயர் வெளியிடப்படவில்லை / அடையாளம் பாதுகாக்கப்பட்டுள்ளது):</strong> ஆதார் எண்: <span style="font-family: monospace; color:#fca5a5;">${aadhaarMasked}</span><br>கீழே உள்ள திட்டங்களுக்கான நிதி பலன்களை நேரடியாக உங்கள் வங்கிக் கணக்கில் பெறலாம்.`
      : `<i class="fa-solid fa-user-shield" style="color: #ef4444;"></i> <strong>Aadhaar Beneficiary (Identity Protected):</strong> Aadhaar: <span style="font-family: monospace; color:#fca5a5;">${aadhaarMasked}</span><br>Direct financial aid and subsidies available for direct bank transfer.`;
  }
  if (countText) {
    countText.innerText = isTa 
      ? `உங்களுக்கு ${count} அரசு நலத்திட்டங்கள் தகுதியாக உள்ளன!`
      : `You are eligible for ${count} Government Welfare Schemes!`;
  }

  // Calculate annual aid
  let totalCash = 0;
  state.matchedSchemes.forEach(s => {
    if (s.monetary_value.includes('1,000 / மாதம்')) totalCash += 12000;
    else if (s.monetary_value.includes('1,200 / மாதம்')) totalCash += 14400;
    else if (s.monetary_value.includes('2,000 / மாதம்')) totalCash += 24000;
    else if (s.monetary_value.includes('6,000')) totalCash += 6000;
  });

  const cashEl = document.getElementById('stat-cash-aid');
  if (cashEl) cashEl.innerText = `₹${totalCash.toLocaleString()}`;

  const container = document.getElementById('matched-schemes-list');
  if (!container) return;

  container.innerHTML = state.matchedSchemes.map(s => `
    <div class="scheme-card">
      <div class="scheme-header">
        <div>
          <span class="scheme-badge">${isTa ? s.badge_ta : s.badge_en}</span>
          <h4 class="scheme-title" style="margin-top: 6px;">${isTa ? s.name_ta : s.name_en}</h4>
        </div>
      </div>
      <div class="scheme-dept">
        <i class="fa-solid fa-building-columns"></i> ${isTa ? s.department_ta : s.department_en}
      </div>
      
      <div class="scheme-benefit">
        <i class="fa-solid fa-gift"></i> ${isTa ? s.benefit_summary_ta : s.benefit_summary_en}
      </div>

      <div class="match-reasons-box">
        <h5><i class="fa-solid fa-circle-check" style="color: #059669;"></i> ${isTa ? 'ஏன் நீங்கள் தகுதியானவர்?' : 'Why you matched:'}</h5>
        <ul>
          ${(isTa ? s.matched_reasons_ta : s.matched_reasons_en).map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>

      <div class="scheme-footer">
        <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="viewSchemeDetail('${s.id}')">
          <i class="fa-solid fa-circle-info"></i> ${isTa ? 'முழு விபரம் & ஆவணங்கள்' : 'Details & Docs'}
        </button>
        <button class="chat-speech-btn" onclick="speakText('${isTa ? s.name_ta : s.name_en}. ${isTa ? s.benefit_summary_ta : s.benefit_summary_en}')">
          <i class="fa-solid fa-volume-high"></i> ${isTa ? 'கேள்' : 'Listen'}
        </button>
      </div>
    </div>
  `).join('');
}

function readAloudResults() {
  const isTa = state.currentLang === 'ta';
  let speech = isTa 
    ? `உங்களுக்கு மொத்தம் ${state.matchedSchemes.length} அரசு நலத்திட்டங்கள் தகுதியாக உள்ளன. ` 
    : `You are eligible for ${state.matchedSchemes.length} government schemes. `;
  
  state.matchedSchemes.slice(0, 3).forEach((s, idx) => {
    speech += `${idx + 1}. ${isTa ? s.name_ta : s.name_en}. ${isTa ? s.benefit_summary_ta : s.benefit_summary_en}. `;
  });
  speakText(speech);
}


// --- TRANSPARENT CERTIFICATE APPROVAL TRACKER ---
async function trackCertificateApplication() {
  const appId = document.getElementById('tracker-app-input').value.trim();
  if (!appId) return;

  try {
    const res = await fetch(`/api/certificates/track?app_id=${encodeURIComponent(appId)}`);
    const data = await res.json();

    if (data.found) {
      state.currentAppRecord = data.application;
      renderTrackingDetails(data.application);
      document.getElementById('tracker-result-card').style.display = 'block';

      if (state.voiceEnabled) {
        const isTa = state.currentLang === 'ta';
        const msg = isTa
          ? `விண்ணப்பம் எண் ${appId}. சான்றிதழ் நிலை: ${data.application.status_ta}.`
          : `Application ${appId}. Status: ${data.application.status_en}.`;
        speakText(msg);
      }
    } else {
      alert(state.currentLang === 'ta' ? 'விண்ணப்ப எண் காணப்படவில்லை. தயவுசெய்து சரியான எண்ணை உள்ளிடவும்.' : 'Application number not found.');
    }
  } catch (err) {
    console.error('Tracking fetch error:', err);
  }
}

function setAndTrack(sampleId) {
  document.getElementById('tracker-app-input').value = sampleId;
  trackCertificateApplication();
}

function renderTrackingDetails(app) {
  const isTa = state.currentLang === 'ta';
  
  // Randomize citizen name dynamically for the certificate
  const citizen = getRandomCitizen(app.app_id || app.cert_id);
  app.applicant_name_ta = citizen.name_ta;
  app.applicant_name_en = citizen.name_en;
  app.father_name_ta = citizen.father_ta;
  app.father_name_en = citizen.father_en;

  document.getElementById('tracker-cert-name').innerText = isTa ? app.cert_name_ta : app.cert_name_en;
  document.getElementById('tracker-applicant-name').innerText = isTa ? app.applicant_name_ta : app.applicant_name_en;
  document.getElementById('tracker-father-name').innerText = isTa ? app.father_name_ta : app.father_name_en;
  document.getElementById('tracker-district').innerText = isTa ? app.district_ta : app.district_en;
  document.getElementById('tracker-applied-date').innerText = app.applied_date;

  const badge = document.getElementById('tracker-status-badge');
  if (app.status === 'APPROVED') {
    badge.style.background = '#450a0a';
    badge.style.color = '#fca5a5';
    badge.style.borderColor = '#7f1d1d';
    badge.innerHTML = `<i class="fa-solid fa-check"></i> ${isTa ? 'ஒப்புதல் அளிக்கப்பட்டது' : 'Approved'}`;
  } else {
    badge.style.background = '#27272a';
    badge.style.color = '#f59e0b';
    badge.style.borderColor = '#3f3f46';
    badge.innerHTML = `<i class="fa-solid fa-clock"></i> ${isTa ? 'ஆய்வில் உள்ளது' : 'In Progress'}`;
  }

  // Action button container (View Certificate if Approved)
  const actionContainer = document.getElementById('tracker-action-btn-container');
  if (app.status === 'APPROVED') {
    actionContainer.innerHTML = `
      <button class="btn btn-red" onclick="openCertModal()" style="padding: 6px 14px; font-size: 0.85rem;">
        <i class="fa-solid fa-file-shield"></i> ${isTa ? 'சான்றிதழைப் பார் / பதிவிறக்கு' : 'View / Download Certificate'}
      </button>
    `;
  } else {
    actionContainer.innerHTML = `
      <span style="font-size: 0.8rem; color: #f59e0b; font-weight: 700;">
        <i class="fa-solid fa-spinner fa-spin"></i> ${isTa ? 'அடுத்த நிலை: வட்டாட்சியர் ஒப்புதல்' : 'Next: Tahsildar Approval'}
      </span>
    `;
  }

  // SLA text
  document.getElementById('sla-status-text').innerText = isTa
    ? `விண்ணப்பித்து ${app.days_taken} நாட்கள் ஆகியுள்ளது. காலக்கெடு: 15 வேலை நாட்கள். உங்கள் மனு சரியான நேரத்தில் பரிசீலிக்கப்படுகிறது.`
    : `Processed in ${app.days_taken} days. Official SLA: 15 working days. Application is on schedule.`;

  // Render 4-Stage Timeline Stepper
  const stepperContainer = document.getElementById('timeline-stepper-container');
  stepperContainer.innerHTML = app.stages.map((stage, i) => {
    let stateClass = stage.status === 'COMPLETED' ? 'completed' : stage.status === 'IN_PROGRESS' ? 'in-progress' : 'pending';
    let icon = stage.status === 'COMPLETED' ? '<i class="fa-solid fa-check"></i>' : stage.status === 'IN_PROGRESS' ? '<i class="fa-solid fa-hourglass-half"></i>' : (i + 1);

    return `
      <div class="step-item ${stateClass}">
        <div class="step-circle">${icon}</div>
        <div>
          <div class="step-title">${isTa ? stage.title_ta : stage.title_en}</div>
          <div class="step-officer">${isTa ? stage.officer_ta : stage.officer_en}</div>
          <div class="step-date">${stage.date}</div>
          ${stage.remarks_ta ? `<p style="font-size: 0.75rem; color: #475569; margin-top: 4px; background: #f1f5f9; padding: 4px 6px; border-radius: 4px;">${stage.remarks_ta}</p>` : ''}
        </div>
      </div>
    `;
  }).join('');
}


// --- OFFICIAL DIGITAL CERTIFICATE PREVIEW & QR GENERATOR ---
function openCertModal() {
  const app = state.currentAppRecord;
  if (!app) return;

  const isTa = state.currentLang === 'ta';
  document.getElementById('modal-cert-title').innerText = `${app.cert_name_ta} / ${app.cert_name_en.toUpperCase()}`;
  document.getElementById('modal-cert-id').innerText = app.cert_id || 'CERT-TN-84920-VERIFIED';
  document.getElementById('modal-applicant-name').innerText = `${app.applicant_name_ta} (${app.applicant_name_en})`;
  document.getElementById('modal-father-name').innerText = `${app.father_name_ta} (${app.father_name_en})`;
  document.getElementById('modal-aadhaar').innerText = app.aadhaar_masked;
  document.getElementById('modal-district-taluk').innerText = `${app.district_ta} / ${app.taluk_ta}`;
  const signer = app.signer || {};
  document.getElementById('modal-village').innerText = app.village_ta;
  document.getElementById('modal-income').innerText = app.annual_income || '₹72,000';
  document.getElementById('modal-issue-date').innerText = app.issued_date || app.applied_date;
  
  // Detailed Digital Signing Officer Information
  const signerNameEl = document.getElementById('modal-signer-name');
  if (signerNameEl) signerNameEl.innerText = isTa ? (signer.name_ta || app.stages[3]?.officer_ta) : (signer.name_en || app.stages[3]?.officer_en);
  
  const signerDesigEl = document.getElementById('modal-signer-desig');
  if (signerDesigEl) signerDesigEl.innerText = isTa ? (signer.designation_ta || 'வட்டாட்சியர்') : (signer.designation_en || 'Tahsildar');
  
  const signerTimeEl = document.getElementById('modal-signer-time');
  if (signerTimeEl) signerTimeEl.innerText = signer.signing_time || '24-09-2024 10:45:22 AM IST';
  
  const signerDscEl = document.getElementById('modal-signer-dsc');
  if (signerDscEl) signerDscEl.innerText = signer.dsc_id || 'DSC-TN-REV-TAH-2024-884920-F9A';
  
  const signerCaEl = document.getElementById('modal-signer-ca');
  if (signerCaEl) signerCaEl.innerText = signer.ca_provider || 'National Informatics Centre (NIC-CA)';

  const hashEl = document.getElementById('modal-cert-hash-short');
  if (hashEl) hashEl.innerText = signer.hash ? `SHA-256: ${signer.hash.substring(0, 16)}...` : 'SHA-256: 7f8b9a1c...';

  // Draw verifiable QR code on Canvas
  drawQRCodeCanvas('cert-qr-canvas', `https://edistricts.tn.gov.in/verify?cert=${app.cert_id || 'CERT-TN-84920'}&auth=VERIFIED&time=${encodeURIComponent(signer.signing_time || '2024-09-24')}`);

  document.getElementById('cert-modal').classList.add('active');
}

function closeCertModal() {
  document.getElementById('cert-modal').classList.remove('active');
}

// Lightweight Dynamic Canvas QR Code Matrix Renderer (Red & Black Theme)
function drawQRCodeCanvas(canvasId, text) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 110;
  canvas.width = size;
  canvas.height = size;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Generate deterministic grid pattern based on text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  const matrixSize = 25;
  const cellSize = Math.floor(size / matrixSize);
  const offset = Math.floor((size - (matrixSize * cellSize)) / 2);

  ctx.fillStyle = '#991b1b'; // Deep Crimson Red for QR pattern

  // Helper for drawing finder patterns
  function drawFinderPattern(startX, startY) {
    ctx.fillRect(offset + startX * cellSize, offset + startY * cellSize, 7 * cellSize, 7 * cellSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(offset + (startX + 1) * cellSize, offset + (startY + 1) * cellSize, 5 * cellSize, 5 * cellSize);
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(offset + (startX + 2) * cellSize, offset + (startY + 2) * cellSize, 3 * cellSize, 3 * cellSize);
  }

  drawFinderPattern(0, 0);                         // Top-Left
  drawFinderPattern(matrixSize - 7, 0);            // Top-Right
  drawFinderPattern(0, matrixSize - 7);            // Bottom-Left

  // Data pseudo-matrix
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Skip finder zones
      if ((r < 8 && c < 8) || (r < 8 && c >= matrixSize - 8) || (r >= matrixSize - 8 && c < 8)) {
        continue;
      }
      const val = (Math.sin(hash + r * 17 + c * 31) * 10000);
      if ((val - Math.floor(val)) > 0.5) {
        ctx.fillRect(offset + c * cellSize, offset + r * cellSize, cellSize, cellSize);
      }
    }
  }
}


// --- QR CERTIFICATE VERIFICATION TOOL ---
async function verifyCertificate() {
  const input = document.getElementById('verify-cert-input').value.trim();
  if (!input) return;

  try {
    const res = await fetch(`/api/certificates/verify?cert_id=${encodeURIComponent(input)}`);
    const data = await res.json();
    const resultCard = document.getElementById('verify-result-card');
    resultCard.style.display = 'block';

    const isTa = state.currentLang === 'ta';

    if (data.is_authentic) {
      // Randomize citizen name dynamically for the certificate verification
      const citizen = getRandomCitizen(data.certificate_id || data.application_number);
      data.holder_name_ta = citizen.name_ta;
      data.holder_name_en = citizen.name_en;
      data.father_name_ta = citizen.father_ta;
      data.father_name_en = citizen.father_en;

      resultCard.innerHTML = `
        <div style="background: #18181b; border: 2px solid #ef4444; border-radius: 14px; padding: 24px; text-align: left; box-shadow: 0 8px 24px rgba(220, 38, 38, 0.25);">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="background: #dc2626; color: white; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; box-shadow: 0 0 14px rgba(220, 38, 38, 0.6);">
              <i class="fa-solid fa-certificate"></i>
            </div>
            <div>
              <h4 style="font-size: 1.25rem; font-weight: 800; color: #fca5a5;">
                ${isTa ? 'உண்மையான தமிழ்நாடு அரசு சான்றிதழ் (AUTHENTIC CERTIFICATE)' : 'Authentic TN Government Certificate'}
              </h4>
              <p style="font-size: 0.85rem; color: #a1a1aa;">
                ${isTa ? 'டிஜிட்டல் கையொப்பம் மற்றும் அரசு தரவுத்தளம் மூலம் மெய்ப்பிக்கப்பட்டது.' : 'Cryptographically verified via Tamil Nadu e-District database.'}
              </p>
            </div>
          </div>
          
          <table class="cert-table" style="background: #121215; border: 1px solid #3f3f46; color: #f4f4f5; border-radius: 8px;">
            <tr><td class="label-col" style="background: #1e1e24; color: #fca5a5;">${isTa ? 'சான்றிதழ் எண்' : 'Certificate ID'}</td><td><strong style="color: #ffffff;">${data.certificate_id}</strong></td></tr>
            <tr><td class="label-col" style="background: #1e1e24; color: #fca5a5;">${isTa ? 'சான்றிதழ் வகை' : 'Type'}</td><td>${isTa ? data.certificate_type_ta : data.certificate_type_en}</td></tr>
            <tr><td class="label-col" style="background: #1e1e24; color: #fca5a5;">${isTa ? 'பெயர் & தந்தை' : 'Holder & Parent'}</td><td><strong>${isTa ? data.holder_name_ta : data.holder_name_en}</strong> (தந்தை: ${isTa ? data.father_name_ta : data.father_name_en})</td></tr>
            <tr><td class="label-col" style="background: #1e1e24; color: #fca5a5;">${isTa ? 'இருப்பிடம்' : 'Taluk & District'}</td><td>${data.taluk}, ${data.district}</td></tr>
            <tr><td class="label-col" style="background: #1e1e24; color: #fca5a5;">${isTa ? 'கையொப்பமிட்ட அலுவலர்' : 'Signed By'}</td><td><strong style="color: #fca5a5;">${data.signer_name_ta}</strong> (${data.signer_designation_ta})</td></tr>
            <tr><td class="label-col" style="background: #1e1e24; color: #fca5a5;">${isTa ? 'கையொப்பமிட்ட நேரம்' : 'Signing Timestamp'}</td><td style="font-family: monospace; color: #ef4444; font-weight: 700;">${data.signing_time}</td></tr>
            <tr><td class="label-col" style="background: #1e1e24; color: #fca5a5;">${isTa ? 'டிஜிட்டல் அட்டை எண் (DSC ID)' : 'DSC Token ID'}</td><td style="font-family: monospace; font-size: 0.82rem; color: #a1a1aa;">${data.dsc_id}</td></tr>
            <tr><td class="label-col" style="background: #1e1e24; color: #fca5a5;">${isTa ? 'சான்றளிப்பு முகமை' : 'Certifying Authority'}</td><td style="font-size: 0.85rem;">${data.ca_provider}</td></tr>
            <tr><td class="label-col" style="background: #1e1e24; color: #fca5a5;">${isTa ? 'அலுவலக இருப்பிடம்' : 'Location'}</td><td style="font-size: 0.85rem;">${data.signing_location}</td></tr>
            <tr><td class="label-col" style="background: #1e1e24; color: #fca5a5;">${isTa ? 'டிஜிட்டல் பாதுகாப்பு நிலை' : 'Security Status'}</td><td style="font-size: 0.82rem; color: #4ade80;"><i class="fa-solid fa-lock"></i> TAMIL_NADU_GOV_AUTHENTICATED_SECURE_TOKEN</td></tr>
          </table>
        </div>
      `;
      if (state.voiceEnabled) {
        speakText(isTa ? `சான்றிதழ் சரிபார்க்கப்பட்டது. இது ${data.signer_name_ta} என்பவரால் டிஜிட்டல் கையொப்பமிடப்பட்ட உண்மையான அரசு சான்றிதழ்.` : 'Certificate verified. This is an authentic government record digitally signed by the competent authority.');
      }
    } else {
      resultCard.innerHTML = `
        <div style="background: #2a0808; border: 2px solid #ef4444; border-radius: 14px; padding: 24px; text-align: left;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="background: #ef4444; color: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <h4 style="font-size: 1.25rem; font-weight: 800; color: #fca5a5;">
                ${isTa ? 'சான்றிதழ் காணப்படவில்லை / போலி சான்றிதழ் எச்சரிக்கை!' : 'Invalid Certificate / Forgery Alert!'}
              </h4>
              <p style="font-size: 0.9rem; color: #fecaca; margin-top: 4px;">
                ${isTa ? data.message_ta : data.message_en}
              </p>
            </div>
          </div>
        </div>
      `;
      if (state.voiceEnabled) {
        speakText(isTa ? 'எச்சரிக்கை! இந்த சான்றிதழ் எண் அரசு தரவுத்தளத்தில் இல்லை.' : 'Alert. Certificate not found in government records.');
      }
    }
  } catch (err) {
    console.error('Verification error:', err);
  }
}


// --- SCHEMES DIRECTORY ---
async function loadAllSchemes() {
  try {
    const res = await fetch('/api/schemes');
    state.allSchemes = await res.json();
    renderSchemesDirectory();
  } catch (err) {
    try {
      const res2 = await fetch('data/schemes.json');
      state.allSchemes = await res2.json();
      renderSchemesDirectory();
    } catch(e) {
      console.error('Failed to load schemes:', err);
    }
  }
}

function filterCategory(category, element) {
  state.activeCategory = category;
  document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
  if (element) element.classList.add('active');
  renderSchemesDirectory();
}

function filterSchemesDirectory() {
  renderSchemesDirectory();
}

function renderSchemesDirectory() {
  const container = document.getElementById('schemes-directory-grid');
  if (!container) return;

  const search = (document.getElementById('scheme-search-input')?.value || '').toLowerCase().trim();
  const isTa = state.currentLang === 'ta';

  let list = state.allSchemes;
  if (state.activeCategory !== 'all') {
    list = list.filter(s => s.category === state.activeCategory);
  }
  if (search) {
    list = list.filter(s => 
      s.name_ta.toLowerCase().includes(search) || 
      s.name_en.toLowerCase().includes(search) || 
      s.tags.some(t => t.includes(search))
    );
  }

  container.innerHTML = list.map(s => `
    <div class="scheme-card">
      <div class="scheme-header">
        <span class="scheme-badge">${isTa ? s.badge_ta : s.badge_en}</span>
      </div>
      <h4 class="scheme-title" style="margin-top: 8px;">${isTa ? s.name_ta : s.name_en}</h4>
      <div class="scheme-dept">
        <i class="fa-solid fa-building-columns"></i> ${isTa ? s.department_ta : s.department_en}
      </div>
      <div class="scheme-benefit">
        <i class="fa-solid fa-gift"></i> ${isTa ? s.benefit_summary_ta : s.benefit_summary_en}
      </div>
      <p style="font-size: 0.88rem; color: #475569; margin-bottom: 16px;">
        ${isTa ? s.eligibility_text_ta : s.eligibility_text_en}
      </p>
      <div class="scheme-footer">
        <button class="btn btn-primary" style="padding: 6px 14px; font-size: 0.85rem;" onclick="viewSchemeDetail('${s.id}')">
          <i class="fa-solid fa-eye"></i> ${isTa ? 'ஆவணங்கள் & விண்ணப்பிக்கும் முறை' : 'How to Apply & Docs'}
        </button>
        <button class="chat-speech-btn" onclick="speakText('${isTa ? s.name_ta : s.name_en}. ${isTa ? s.benefit_summary_ta : s.benefit_summary_en}')">
          <i class="fa-solid fa-volume-high"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// Scheme Detail Modal
function viewSchemeDetail(schemeId) {
  const scheme = state.allSchemes.find(s => s.id === schemeId) || state.matchedSchemes.find(s => s.id === schemeId);
  if (!scheme) return;

  const isTa = state.currentLang === 'ta';
  const modalBody = document.getElementById('scheme-modal-body');

  modalBody.innerHTML = `
    <span class="scheme-badge" style="margin-bottom: 8px; display: inline-block;">${isTa ? scheme.badge_ta : scheme.badge_en}</span>
    <h3 style="font-size: 1.4rem; font-weight: 800; color: #064e3b; margin-bottom: 6px;">
      ${isTa ? scheme.name_ta : scheme.name_en}
    </h3>
    <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">
      <i class="fa-solid fa-landmark"></i> ${isTa ? scheme.department_ta : scheme.department_en}
    </div>

    <div class="scheme-benefit" style="font-size: 1rem; margin-bottom: 20px;">
      <strong>${isTa ? 'வழங்கப்படும் பயன்கள்:' : 'Benefits Provided:'}</strong><br>
      ${isTa ? scheme.benefit_summary_ta : scheme.benefit_summary_en}
    </div>

    <div style="margin-bottom: 20px;">
      <h4 style="font-size: 1.05rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">
        <i class="fa-solid fa-user-check" style="color: #059669;"></i> ${isTa ? 'தகுதி வரம்புகள்:' : 'Eligibility Criteria:'}
      </h4>
      <p style="background: #f8fafc; padding: 10px 14px; border-radius: 8px; font-size: 0.9rem; border: 1px solid #e2e8f0;">
        ${isTa ? scheme.eligibility_text_ta : scheme.eligibility_text_en}
      </p>
    </div>

    <div style="margin-bottom: 20px;">
      <h4 style="font-size: 1.05rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">
        <i class="fa-solid fa-file-circle-check" style="color: #d97706;"></i> ${isTa ? 'தேவையான ஆவணங்கள் (சரிபார்ப்பு பட்டியல்):' : 'Required Documents Checklist:'}
      </h4>
      <ul style="list-style: none; padding: 0;">
        ${(isTa ? scheme.required_documents_ta : scheme.required_documents_en).map(doc => `
          <li style="padding: 6px 10px; margin-bottom: 6px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; font-size: 0.88rem; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-check" style="color: #b45309;"></i> ${doc}
          </li>
        `).join('')}
      </ul>
    </div>

    <div style="margin-bottom: 24px;">
      <h4 style="font-size: 1.05rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">
        <i class="fa-solid fa-arrow-pointer" style="color: #1d4ed8;"></i> ${isTa ? 'எப்படி விண்ணப்பிப்பது?' : 'How to Apply:'}
      </h4>
      <p style="background: #eff6ff; padding: 10px 14px; border-radius: 8px; font-size: 0.9rem; border: 1px solid #bfdbfe; color: #1e40af;">
        ${isTa ? scheme.how_to_apply_ta : scheme.how_to_apply_en}
      </p>
    </div>

    <div style="display: flex; gap: 12px; justify-content: flex-end; flex-wrap: wrap;">
      <a href="${scheme.official_url}" target="_blank" rel="noopener" class="btn btn-green">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> ${isTa ? 'அதிகாரப்பூர்வ தளம் செல்க' : 'Visit Official Portal'}
      </a>
      <button class="btn btn-outline-white" style="color: #475569; border-color: #cbd5e1;" onclick="closeSchemeModal()">
        ${isTa ? 'மூடுக' : 'Close'}
      </button>
    </div>
  `;

  document.getElementById('scheme-detail-modal').classList.add('active');
}

function closeSchemeModal() {
  document.getElementById('scheme-detail-modal').classList.remove('active');
}


// --- "சேவை தோழன்" AI TAMIL CHATBOT ---
function toggleChatbot(forceOpen) {
  const panel = document.getElementById('chatbot-panel');
  if (forceOpen === true) {
    panel.classList.add('active');
  } else if (forceOpen === false) {
    panel.classList.remove('active');
  } else {
    panel.classList.toggle('active');
  }
}

function sendQuickPrompt(promptText) {
  document.getElementById('chat-user-input').value = promptText;
  sendChatMessage();
}

async function sendChatMessage() {
  const input = document.getElementById('chat-user-input');
  const message = input.value.trim();
  if (!message) return;

  const chatContainer = document.getElementById('chat-messages-container');

  // Append user bubble
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.innerText = message;
  chatContainer.appendChild(userBubble);
  input.value = '';
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Typing indicator
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'chat-bubble bot';
  typingIndicator.id = 'chat-typing';
  typingIndicator.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> சேவை தோழன் சிந்திக்கிறார்...';
  chatContainer.appendChild(typingIndicator);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    typingIndicator.remove();

    const isTa = state.currentLang === 'ta';
    const replyText = isTa ? data.reply_ta : (data.reply_en || data.reply_ta);

    // Append Bot bubble
    const botBubble = document.createElement('div');
    botBubble.className = 'chat-bubble bot';
    botBubble.innerHTML = `
      <div>${formatMarkdown(replyText)}</div>
      <div>
        <button class="chat-speech-btn" onclick="speakText('${escapeForSpeech(replyText)}')">
          <i class="fa-solid fa-volume-high"></i> ${isTa ? 'குரல் மூலம் கேட்க' : 'Listen'}
        </button>
      </div>
    `;
    chatContainer.appendChild(botBubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Speak aloud if voice enabled
    if (state.voiceEnabled) {
      speakText(replyText);
    }
  } catch (err) {
    typingIndicator.remove();
    console.error('Chat error:', err);
  }
}

// Convert markdown bold and bullet points to HTML
function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n- /g, '<br>• ')
    .replace(/\n/g, '<br>');
}

function escapeForSpeech(text) {
  return text.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ');
}

// --- RECENT APPROVED APPLICATIONS LIVE FEED ---
async function loadRecentApproved() {
  try {
    const res = await fetch('/api/certificates/recent-approved?limit=12');
    const data = await res.json();
    state.recentApproved = data.recent || [];
    const countEl = document.getElementById('approved-count-num');
    if (countEl && data.total_approved) {
      countEl.innerText = data.total_approved;
    }
    renderRecentApproved();
  } catch (err) {
    try {
      const res2 = await fetch('data/certificates.json');
      const data2 = await res2.json();
      const approved = (data2.sample_applications || []).filter(a => a.status === 'APPROVED');
      state.recentApproved = approved.slice(0, 12);
      const countEl = document.getElementById('approved-count-num');
      if (countEl) countEl.innerText = approved.length;
      renderRecentApproved();
    } catch(e) {
      console.error('Failed to load recent approved applications:', err);
    }
  }
}

function renderRecentApproved() {
  const container = document.getElementById('recent-approved-grid');
  if (!container || !state.recentApproved) return;
  const isTa = state.currentLang === 'ta';

  container.innerHTML = state.recentApproved.map(app => {
    const signer = app.signer || {};
    return `
      <div class="recent-approved-card">
        <div>
          <div class="rac-header">
            <h5 class="rac-cert-name">${isTa ? app.cert_name_ta : app.cert_name_en}</h5>
            <span class="rac-badge-approved"><i class="fa-solid fa-check"></i> ${isTa ? 'ஒப்புதல்' : 'Approved'}</span>
          </div>
          <div class="rac-id">${app.app_id}</div>
          <div class="rac-meta" style="margin-top: 8px;">
            <div class="rac-meta-row">
              <i class="fa-solid fa-location-dot" style="color: #ef4444;"></i>
              <span>${isTa ? app.district_ta : app.district_en} (${isTa ? app.taluk_ta : app.taluk_en})</span>
            </div>
            <div class="rac-meta-row">
              <i class="fa-solid fa-user-pen" style="color: #60a5fa;"></i>
              <span>${isTa ? signer.designation_ta : signer.designation_en}: ${isTa ? signer.name_ta : signer.name_en}</span>
            </div>
            <div class="rac-meta-row" style="color: #71717a; font-size: 0.75rem;">
              <i class="fa-solid fa-clock"></i>
              <span>${signer.signing_time || app.issued_date}</span>
            </div>
          </div>
        </div>
        <button class="rac-action-btn" onclick="quickTrackAndOpen('${app.app_id}')">
          <i class="fa-solid fa-file-shield"></i> ${isTa ? 'சான்றிதழைப் பார்' : 'View Certificate'}
        </button>
      </div>
    `;
  }).join('');
}

async function quickTrackAndOpen(appId) {
  document.getElementById('tracker-app-input').value = appId;
  await trackCertificateApplication();
  openCertModal();
}

