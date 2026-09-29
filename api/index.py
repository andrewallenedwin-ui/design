"""
Nalam Tamil Nadu - Vercel Serverless API Handler
Handles /api/* routes on Vercel deployment.
"""

from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import os
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_json(rel_path):
    full_path = os.path.join(BASE_DIR, rel_path)
    if os.path.exists(full_path):
        with open(full_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

SCHEMES = []
CERT_DATA = {}
APP_MAP = {}
CERT_MAP = {}
APPROVED_LIST = []

def init_indices():
    global SCHEMES, CERT_DATA, APP_MAP, CERT_MAP, APPROVED_LIST
    SCHEMES = load_json(os.path.join("data", "schemes.json"))
    CERT_DATA = load_json(os.path.join("data", "certificates.json"))
    
    APP_MAP = {}
    CERT_MAP = {}
    APPROVED_LIST = []
    
    for app in CERT_DATA.get("sample_applications", []):
        aid = app.get("app_id", "").strip().upper()
        if aid:
            APP_MAP[aid] = app
        cid = app.get("cert_id", "").strip().upper()
        if cid and cid != "PENDING":
            CERT_MAP[cid] = app
        qrh = app.get("qr_hash")
        if qrh:
            CERT_MAP[qrh.strip().upper()] = app
        if app.get("status") == "APPROVED":
            APPROVED_LIST.append(app)

init_indices()

def evaluate_scheme_eligibility(profile, scheme):
    rules = scheme.get("eligibility_rules", {})
    reasons_ta = []
    reasons_en = []
    is_eligible = True

    # Check gender
    if "gender" in rules:
        p_gender = profile.get("gender", "").lower()
        if p_gender not in rules["gender"]:
            return False, [], []
        else:
            reasons_ta.append(f"பாலினத் தகுதி பொருந்துகிறது ({'பெண்' if p_gender == 'female' else 'ஆண்'})")
            reasons_en.append(f"Gender criteria met ({p_gender})")

    # Check age
    age = profile.get("age")
    if age is not None:
        try:
            age = int(age)
            if "age_min" in rules and age < rules["age_min"]:
                return False, [], []
            if "age_max" in rules and age > rules["age_max"]:
                return False, [], []
            if "age_min" in rules or "age_max" in rules:
                reasons_ta.append(f"வயது வரம்பு பொருந்துகிறது ({age} வயது)")
                reasons_en.append(f"Age criteria met ({age} yrs)")
        except (ValueError, TypeError):
            pass

    # Check income
    income = profile.get("annual_income")
    if income is not None:
        try:
            income = float(income)
            if "max_income" in rules and income > rules["max_income"]:
                return False, [], []
            if "max_income" in rules:
                reasons_ta.append(f"ஆண்டு வருமானம் ₹{int(rules['max_income']):,} வரம்பிற்குள் உள்ளது (தங்களின் வருமானம்: ₹{int(income):,})")
                reasons_en.append(f"Annual income is within limit of ₹{int(rules['max_income']):,}")
        except (ValueError, TypeError):
            pass

    # Check occupation
    if "occupation" in rules:
        occ = profile.get("occupation", "").lower()
        if occ not in rules["occupation"]:
            return False, [], []
        else:
            reasons_ta.append("தொழில்/பணித் தகுதி பொருந்துகிறது")
            reasons_en.append("Occupation criteria matched")

    # Check community
    if "community" in rules:
        comm = profile.get("community", "").upper()
        if comm not in rules["community"]:
            return False, [], []
        else:
            reasons_ta.append(f"சமூகப் பிரிவு ({comm}) தகுதி பெறுகிறது")
            reasons_en.append(f"Community category ({comm}) matches")

    # Check student status
    if "student_status" in rules:
        p_status = profile.get("student_status", "").lower()
        if p_status != rules["student_status"]:
            return False, [], []

    # Check first graduate
    if rules.get("first_graduate_in_family") is True:
        if not profile.get("first_graduate"):
            return False, [], []
        else:
            reasons_ta.append("குடும்பத்தில் முதல் பட்டதாரி மாணவர்")
            reasons_en.append("First graduate in the family")

    # Check agricultural land / farmer
    if rules.get("has_agricultural_land") is True:
        if not profile.get("has_agricultural_land"):
            return False, [], []
        else:
            reasons_ta.append("விவசாய நில உரிமை ஆவணம் உள்ளது")
            reasons_en.append("Holds agricultural land patta")

    # Check differently abled
    if rules.get("differently_abled") is True:
        if not profile.get("differently_abled"):
            return False, [], []
        else:
            reasons_ta.append("மாற்றுத்திறனாளிகளுக்கான சிறப்புத் திட்டம்")
            reasons_en.append("Eligible under PwD category")

    # Check widow / marital status
    if "marital_status" in rules:
        m_status = profile.get("marital_status", "").lower()
        if m_status not in rules["marital_status"]:
            return False, [], []
        else:
            reasons_ta.append("விதவை / ஆதரவற்ற பெண்கள் சிறப்பு வரம்பு பொருந்துகிறது")
            reasons_en.append("Widow / destitute category applies")

    # General state resident check
    reasons_ta.append("தமிழ்நாடு இருப்பிட தகுதி பொருந்துகிறது")
    reasons_en.append("Tamil Nadu residency criteria satisfied")

    return is_eligible, reasons_ta, reasons_en


def process_chat_query(user_text):
    query = user_text.lower().strip()
    
    # 1. Pudhumai Penn / Tamil Pudhalvan / Student Schemes
    if any(k in query for k in ["புதுமைப் பெண்", "pudhumai penn", "கல்லூரி", "மாணவி", "மாணவர்", "college", "tamil pudhalvan", "புதல்வன்", "1000", "education", "படிப்பு"]):
        return {
            "reply_ta": "🎓 **மாணவர்களுக்கான முக்கிய உதவித்தொகைகள்:**\n\n1. **புதுமைப் பெண் திட்டம்:** அரசுப் பள்ளியில் 6-12 பயின்று கல்லூரி செல்லும் மாணவிகளுக்கு **மாதம் ₹1,000** வங்கிக் கணக்கில் நேரடியாக வழங்கப்படுகிறது.\n2. **தமிழ்ப் புதல்வன் திட்டம்:** அரசுப் பள்ளி மாணவர்களுக்கும் உயர்கல்வி பயிலும் போது **மாதம் ₹1,000** வழங்கப்படுகிறது.\n3. **முதல் பட்டதாரி சலுகை:** குடும்பத்தில் முதல் பட்டதாரி என்றால் அரசு கலந்தாய்வு மூலம் சேரும்போது **முழுக் கல்விக் கட்டண விலக்கு** கிடைக்கும்!\n\n💡 **விண்ணப்பிக்க:** உங்கள் கல்லூரி முதல்வர் அல்லது இ-சேவை மையம் மூலம் அணுகலாம்.",
            "reply_en": "🎓 **Key Student Schemes:**\n\n1. **Pudhumai Penn:** ₹1,000/month for girl students from govt schools pursuing higher education.\n2. **Tamil Pudhalvan:** ₹1,000/month for male students from govt schools in higher education.\n3. **First Graduate Waiver:** Full tuition fee waiver for professional courses.\n\nApply via your college principal or e-Sevai centre.",
            "suggested_actions": [
                {"label_ta": "தகுதி சரிபார்க்க", "label_en": "Check Eligibility", "action": "open_aadhaar"},
                {"label_ta": "தேவையான ஆவணங்கள்", "label_en": "Documents", "action": "show_docs_pudhumai"}
            ]
        }

    # 2. Magalir Urimai Thogai
    if any(k in query for k in ["மகளிர் உரிமை", "magalir urimai", "kmut", "உரிமைத்தொகை", "குடும்பத் தலைவி", "1000 ரூபாய்", "பெண்கள்"]):
        return {
            "reply_ta": "🌸 **கலைஞர் மகளிர் உரிமைத் திட்டம் (மாதம் ₹1,000):**\n\n- **தகுதிகள்:** குடும்பத் தலைவியின் வயது 21 அல்லது அதற்கு மேல் இருக்க வேண்டும். குடும்ப ஆண்டு வருமானம் ₹2.5 லட்சத்திற்குள் இருக்க வேண்டும்.\n- **நில வரம்பு:** 5 ஏக்கர் நஞ்சை அல்லது 10 ஏக்கர் புஞ்சை நிலத்திற்குள்.\n- **மின்சாரம்:** ஆண்டுக்கு 3600 யூனிட்டிற்குள் நுகர்வு இருக்க வேண்டும்.\n\n📌 **தேவையான ஆவணங்கள்:** ஆதார் அட்டை, ஸ்மார்ட் ரேஷன் கார்டு, மின்சார அட்டை எண் மற்றும் ஆதார் இணைக்கப்பட்ட வங்கிக் கணக்கு புத்தகம்.\n\n⚠️ விண்ணப்பம் நிராகரிக்கப்பட்டால் இ-சேவை மையத்தில் மேல்முறையீடு செய்யலாம்.",
            "reply_en": "🌸 **Kalaignar Magalir Urimai Thogai (₹1,000/month):**\n\n- Age 21+ female head of family, annual income under ₹2.5 lakh.\n- Agricultural land under 5 acres (wet) or 10 acres (dry).\n- Annual electricity usage below 3,600 units.\n\nDocuments required: Aadhaar Card, Smart Ration Card, Electricity bill, Bank passbook linked to Aadhaar.",
            "suggested_actions": [
                {"label_ta": "திட்ட விவரங்கள் காண்க", "label_en": "View Details", "action": "view_scheme_magalir"}
            ]
        }

    # 3. Income Certificate / வருமான சான்றிதழ்
    if any(k in query for k in ["வருமான", "income", "வருமானச் சான்றிதழ்", "income certificate"]):
        return {
            "reply_ta": "📄 **வருமானச் சான்றிதழ் (Income Certificate):**\n\n- **வழங்கும் அலுவலர்:** வட்டாட்சியர் (Tahsildar)\n- **அரசு கட்டணம்:** ₹60 (இ-சேவை மையம்)\n- **கால அவகாசம் (SLA):** 15 வேலை நாட்கள்\n- **செல்லுபடியாகும் காலம்:** 1 வருடம்\n\n📋 **தேவையான ஆவணங்கள்:**\n1. விண்ணப்பதாரர் ஆதார் அட்டை\n2. குடும்ப அட்டை (Smart Ration Card)\n3. மாத சம்பளச் சீட்டு அல்லது VAO வருமான மதிப்பீடு அறிக்கை\n4. பாஸ்போர்ட் அளவு புகைப்படம்\n\n🔎 எங்கள் தளத்தில் 'சான்றிதழ் கண்காணிப்பு' பகுதியில் உங்கள் விண்ணப்ப நிலையை நேரடியாகக் கண்காணிக்கலாம்.",
            "reply_en": "📄 **Income Certificate Information:**\n\n- Issuing Authority: Tahsildar\n- Govt Fee: ₹60 (e-Sevai)\n- Processing SLA: 15 Working Days\n- Validity: 1 Year\n\nRequired: Aadhaar Card, Ration Card, Salary slip or VAO assessment, Passport photo.",
            "suggested_actions": [
                {"label_ta": "சான்றிதழ் கண்காணிக்க", "label_en": "Track Status", "action": "open_tracker"}
            ]
        }

    # 4. Community Certificate / சாதி சான்றிதழ்
    if any(k in query for k in ["சாதி", "community", "community certificate", "சாதிச் சான்றிதழ்", "caste"]):
        return {
            "reply_ta": "📜 **சாதிச் சான்றிதழ் (Community Certificate):**\n\n- **செல்லுபடியாகும் காலம்:** வாழ்நாள் முழுவதும் (Life-Time)\n- **அரசு கட்டணம்:** ₹60\n- **கால அவகாசம்:** 15 நாட்கள்\n\n📋 **தேவையான ஆவணங்கள்:**\n1. விண்ணப்பதாரர் ஆதார் அட்டை\n2. தந்தை/தாய் அல்லது உடன்பிறந்தோரின் சாதிச் சான்றிதழ்\n3. பள்ளி மாற்றுச் சான்றிதழ் (TC)\n4. ரேஷன் கார்டு\n\n💡 இது உங்கள் பள்ளி/கல்லூரி சேர்க்கை மற்றும் அரசு இடஒதுக்கீட்டிற்கு மிக முக்கியமானது.",
            "reply_en": "📜 **Community Certificate Information:**\n\n- Validity: Life-time\n- Govt Fee: ₹60\n- SLA: 15 Days\n\nRequired: Aadhaar Card, Parents' Community Certificate, School Transfer Certificate, Ration Card.",
            "suggested_actions": [
                {"label_ta": "நிலையை சரிபார்க்க", "label_en": "Track Status", "action": "open_tracker"}
            ]
        }

    # 5. Farmer / PM-KISAN / உழவர்
    if any(k in query for k in ["விவசாயி", "உழவர்", "farmer", "pm kisan", "மானியங்கள்", "பயிர்", "நிலம்"]):
        return {
            "reply_ta": "🌾 **விவசாயிகளுக்கான அரசு சலுகைகள்:**\n\n1. **PM-KISAN:** விவசாயிகளுக்கு ஆண்டுக்கு **₹6,000** (3 தவணைகளாக ₹2,000 வீதம்) நேரடியாக வங்கிக்கு வருகிறது.\n2. **இலவச விவசாய மின்சாரம்:** தமிழ்நாடு அரசு சார்பில் விவசாய பம்புசெட்டுகளுக்கு இலவச மும்முனை மின்சாரம்.\n3. **உழவன் செயலி மானியங்கள்:** உழவு இயந்திரங்கள், விதை, உரம் மற்றும் பயிர் காப்பீட்டிற்கு 50% வரை மானியம்.\n\n🚜 **விண்ணப்பிக்க:** வட்டார வேளாண்மை விரிவாக்க மையம் அல்லது 'உழவன்' செயலியைப் பயன்படுத்தலாம்.",
            "reply_en": "🌾 **Farmer Benefits:**\n\n1. PM-KISAN: ₹6,000/year in 3 installments.\n2. Free agricultural electricity for pumpsets in Tamil Nadu.\n3. Uzhavan App subsidies: 50% discount on seeds, machinery, and crop insurance.",
            "suggested_actions": [
                {"label_ta": "திட்ட விவரம் காண்க", "label_en": "View Scheme", "action": "view_scheme_pmkisan"}
            ]
        }

    # 6. First Graduate Certificate / முதல் பட்டதாரி
    if any(k in query for k in ["முதல் பட்டதாரி", "first graduate", "பட்டதாரி"]):
        return {
            "reply_ta": "🎓 **முதல் பட்டதாரி சான்றிதழ் (First Graduate):**\n\n- இந்த சான்றிதழ் பெற்றால் பொறியியல் (Engineering), வேளாண்மை போன்ற தொழிற்கல்வி படிப்புகளுக்கு **முழுக் கல்விக் கட்டண விலக்கு** கிடைக்கும்!\n- குடும்பத்தில் தந்தை, தாய், அண்ணன், தம்பி, அக்கா, தங்கை என யாரும் டிகிரி முடித்திருக்கக் கூடாது.\n\n📋 **தேவையான ஆவணங்கள்:**\n1. 10 & 12-ஆம் வகுப்பு மதிப்பெண் சான்றிதழ்\n2. பெற்றோர் & உடன்பிறந்தோரின் பள்ளி மாற்றுச் சான்றிதழ்கள் (TC)\n3. ரேஷன் கார்டு மற்றும் ஆதார் அட்டை\n4. கிராம நிர்வாக அலுவலர் (VAO) கள ஆய்வு அறிக்கை",
            "reply_en": "🎓 **First Graduate Certificate:**\n\nWaives full tuition fees for professional degrees like Engineering. No one in the immediate family should have graduated with a degree.\n\nRequired: 10th & 12th marksheets, family member school TCs, Ration card, and VAO verification declaration.",
            "suggested_actions": [
                {"label_ta": "விவரம் பார்க்க", "label_en": "Details", "action": "open_tracker"}
            ]
        }

    # 7. Delay / Grievance / தாமதம் / லஞ்சம்
    if any(k in query for k in ["தாமதம்", "delay", "புகார்", "complain", "grievance", "லஞ்சம்", "பணம் கேட்டால்", "bribe"]):
        return {
            "reply_ta": "🛡️ **வெளிப்படைத்தன்மை மற்றும் புகார் தீர்வு முறை:**\n\nஅரசு விதிகளின்படி சான்றிதழ்கள் 15 நாட்களுக்குள் வழங்கப்பட வேண்டும். எந்த ஒரு இடைத்தரகருக்கும் அல்லது அலுவலருக்கும் பணம் கொடுக்க வேண்டியதில்லை!\n\n📞 **உடனடி உதவி எண்கள்:**\n- **முதலமைச்சரின் உதவி மையம்:** 1100 (கட்டணமில்லா அழைப்பு)\n- **இ-சேவை வாடிக்கையாளர் சேவை:** 1800 425 1333\n- **ஊழல் தடுப்பு உதவி எண்:** 1800 425 2011\n\nஉங்கள் விண்ணப்ப எண்ணைக் கொண்டு எங்கள் தளத்திலேயே எந்த அலுவலரிடம் (VAO / RI / Tahsildar) விண்ணப்பம் உள்ளது என்பதை வெளிப்படையாகப் பார்க்கலாம்!",
            "reply_en": "🛡️ **Transparency & Citizen Grievance Redressal:**\n\nCertificates must be processed within 15 days under the Right to Services act. Never pay bribes!\n\nHelpline numbers:\n- CM Helpline: 1100 (Toll-Free)\n- e-Sevai Helpdesk: 1800 425 1333\n- Directorate of Vigilance & Anti-Corruption: 1800 425 2011",
            "suggested_actions": [
                {"label_ta": "சான்றிதழ் ட்ராக் செய்க", "label_en": "Track Status", "action": "open_tracker"}
            ]
        }

    # Default friendly Tamil response
    return {
        "reply_ta": f"வணக்கம்! நான் உங்கள் **சேவை தோழன்**.\n\nநீங்கள் கேட்ட '{user_text}' பற்றிய தகவல்களை உங்களுக்கு வழங்க மகிழ்ச்சி. நான் உங்களுக்கு உதவக்கூடிய பகுதிகள்:\n\n1. **ஆதார் வழி திட்டங்கள்:** உங்கள் குடும்பத்திற்கு கிடைக்கும் ₹1,000 மகளிர் உரிமைத்தொகை, மாணவர் நல நிதி, விவசாய மானியங்கள்.\n2. **சான்றிதழ்கள்:** வருமானம், சாதி, முதல் பட்டதாரி, இருப்பிடச் சான்றிதழ் பெறத் தேவையான ஆவணங்கள் மற்றும் கட்டணம்.\n3. **நிலை அறிதல்:** விண்ணப்பம் VAO அல்லது வட்டாட்சியரிடம் உள்ளதா என்பதை அறிதல்.\n\nகீழே உள்ள தலைப்புகளில் ஒன்றை தேர்வு செய்து அல்லது உங்கள் கேள்வியை தமிழில் கேளுங்கள்!",
        "reply_en": f"Vanakkam! I am your **Sevai Thozhan** (Citizen Assistant).\n\nI can help you check eligible welfare schemes using your Aadhaar profile, understand required documents for certificates, and track live application status.\n\nPlease pick a topic or ask in Tamil/English!",
        "suggested_actions": [
            {"label_ta": "கல்லூரி மாணவிகளுக்கான ₹1000 திட்டம்", "label_en": "Pudhumai Penn ₹1000", "action": "ask_pudhumai"},
            {"label_ta": "வருமான சான்றிதழ் பெற ஆவணங்கள்", "label_en": "Income Cert Docs", "action": "ask_income"},
            {"label_ta": "விவசாயி மானியங்கள்", "label_en": "Farmer Subsidies", "action": "ask_farmer"}
        ]
    }


class handler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query_params = urllib.parse.parse_qs(parsed.query)

        # API: All schemes
        if path == "/api/schemes":
            category = query_params.get("category", [None])[0]
            search = query_params.get("q", [None])[0]
            results = SCHEMES
            if category and category != "all":
                results = [s for s in results if s.get("category") == category]
            if search:
                s_lower = search.lower()
                results = [
                    s for s in results
                    if s_lower in s.get("name_ta", "").lower()
                    or s_lower in s.get("name_en", "").lower()
                    or any(s_lower in tag for tag in s.get("tags", []))
                ]
            self.send_json_response(results)
            return

        # API: Demo profiles
        if path == "/api/demo-profiles":
            self.send_json_response(CERT_DATA.get("demo_personas", []))
            return

        # API: Certificate types
        if path == "/api/certificates/types":
            self.send_json_response(CERT_DATA.get("certificate_types", []))
            return

        # API: Recent approved certificates feed
        if path == "/api/certificates/recent-approved":
            limit = int(query_params.get("limit", [15])[0])
            self.send_json_response({
                "total_approved": len(APPROVED_LIST),
                "total_applications": len(APP_MAP),
                "recent": APPROVED_LIST[:limit]
            })
            return

        # API: Certificate tracking (O(1) Indexed Fast Lookup)
        if path == "/api/certificates/track":
            app_id = query_params.get("app_id", [""])[0].strip().upper()
            matched = APP_MAP.get(app_id) or CERT_MAP.get(app_id)
            if matched:
                self.send_json_response({"found": True, "application": matched})
            else:
                if re.match(r"^TN-\d{4}-[A-Z]{3}-\d{4,6}$", app_id) or len(app_id) >= 6:
                    mock_app = {
                        "app_id": app_id,
                        "cert_id": f"CERT-{app_id}",
                        "cert_type": "income",
                        "cert_name_ta": "வருமானச் சான்றிதழ்",
                        "cert_name_en": "Income Certificate",
                        "applicant_name_ta": "விண்ணப்பதாரர்",
                        "applicant_name_en": "Citizen Applicant",
                        "father_name_ta": "பெற்றோர் பெயர்",
                        "father_name_en": "Guardian Name",
                        "aadhaar_masked": "XXXX-XXXX-9021",
                        "district_ta": "சென்னை",
                        "district_en": "Chennai",
                        "taluk_ta": "மயிலாப்பூர்",
                        "taluk_en": "Mylapore",
                        "applied_date": "22 செப்டம்பர் 2024",
                        "sla_deadline": "07 அக்டோபர் 2024",
                        "status": "IN_PROGRESS",
                        "status_ta": "வருவாய் ஆய்வாளர் (RI) பரிசீலனையில் உள்ளது",
                        "status_en": "Under Revenue Inspector Review",
                        "days_taken": 7,
                        "current_stage_index": 3,
                        "stages": [
                            {
                                "stage_number": 1,
                                "title_ta": "விண்ணப்பம் சமர்ப்பிக்கப்பட்டது",
                                "title_en": "Application Submitted",
                                "officer_ta": "இ-சேவை மையம் (மயிலாப்பூர்)",
                                "officer_en": "e-Sevai Center (Mylapore)",
                                "date": "22 செப் 2024, 10:00 AM",
                                "status": "COMPLETED",
                                "remarks_ta": "விண்ணப்பக் கட்டணம் ₹60 பெறப்பட்டு பதிவு செய்யப்பட்டது."
                            },
                            {
                                "stage_number": 2,
                                "title_ta": "கிராம நிர்வாக அலுவலர் (VAO) கள ஆய்வு",
                                "title_en": "VAO Field Inspection",
                                "officer_ta": "VAO - மயிலாப்பூர் வட்டம்",
                                "officer_en": "VAO - Mylapore Range",
                                "date": "24 செப் 2024, 03:30 PM",
                                "status": "COMPLETED",
                                "remarks_ta": "கள ஆய்வு முடிந்து அறிக்கை வருவாய் ஆய்வாளருக்கு பரிந்துரைக்கப்பட்டது."
                            },
                            {
                                "stage_number": 3,
                                "title_ta": "வருவாய் ஆய்வாளர் (RI) பரிசீலனை",
                                "title_en": "Revenue Inspector Endorsement",
                                "officer_ta": "வருவாய் ஆய்வாளர், மண்டலம் 9",
                                "officer_en": "Revenue Inspector, Zone 9",
                                "date": "நடப்பு நிலை (In-Review)",
                                "status": "IN_PROGRESS",
                                "remarks_ta": "ஆவணங்கள் சரிபார்க்கப்பட்டு வருகின்றன. வட்டாட்சியர் ஒப்புதலுக்கு விரைவில் செல்லும்."
                            },
                            {
                                "stage_number": 4,
                                "title_ta": "வட்டாட்சியர் (Tahsildar) டிஜிட்டல் ஒப்புதல்",
                                "title_en": "Tahsildar Digital Approval",
                                "officer_ta": "வட்டாட்சியர், மயிலாப்பூர்",
                                "officer_en": "Tahsildar, Mylapore",
                                "date": "காத்திருக்கிறது",
                                "status": "PENDING",
                                "remarks_ta": "இறுதி டிஜிட்டல் கையொப்பம்."
                            }
                        ],
                        "qr_hash": None,
                        "digital_sign_id": None
                    }
                    self.send_json_response({"found": True, "application": mock_app})
                else:
                    self.send_json_response({"found": False, "message_ta": "விண்ணப்ப எண் கண்டுபிடிக்கப்படவில்லை", "message_en": "Application ID not found"})
            return

        # API: Certificate verification (QR code authentication - O(1) Fast Lookup)
        if path == "/api/certificates/verify":
            cert_id = query_params.get("cert_id", [""])[0].strip().upper()
            matched = CERT_MAP.get(cert_id) or APP_MAP.get(cert_id)
            if not matched:
                for app in APPROVED_LIST:
                    if app.get("qr_hash") and cert_id in app.get("qr_hash").upper():
                        matched = app
                        break
            
            if matched and matched.get("status") == "APPROVED":
                signer = matched.get("signer", {})
                self.send_json_response({
                    "is_authentic": True,
                    "certificate_id": matched.get("cert_id"),
                    "application_number": matched.get("app_id"),
                    "certificate_type_ta": matched.get("cert_name_ta"),
                    "certificate_type_en": matched.get("cert_name_en"),
                    "holder_name_ta": matched.get("applicant_name_ta"),
                    "holder_name_en": matched.get("applicant_name_en"),
                    "father_name_ta": matched.get("father_name_ta"),
                    "father_name_en": matched.get("father_name_en"),
                    "district": matched.get("district_ta"),
                    "taluk": matched.get("taluk_ta"),
                    "village": matched.get("village_ta"),
                    "issued_on": matched.get("issued_date"),
                    "issuing_officer": matched.get("stages")[-1].get("officer_ta"),
                    "digital_sign_id": matched.get("digital_sign_id"),
                    "signer_name_ta": signer.get("name_ta", matched.get("stages")[-1].get("officer_ta")),
                    "signer_name_en": signer.get("name_en", "Authorized Officer"),
                    "signer_designation_ta": signer.get("designation_ta", "வட்டாட்சியர்"),
                    "signer_designation_en": signer.get("designation_en", "Tahsildar"),
                    "signing_time": signer.get("signing_time", "24-09-2024 10:45:22 AM IST"),
                    "dsc_id": signer.get("dsc_id", "DSC-TN-REV-TAH-2024-AUTHENTIC"),
                    "ca_provider": signer.get("ca_provider", "NIC Certifying Authority (NIC-CA)"),
                    "signing_location": signer.get("location", "Taluk Office, Tamil Nadu"),
                    "security_seal": "TAMIL_NADU_GOVERNMENT_AUTHENTICATED_SECURE_TOKEN",
                    "verification_time": "நேரடி மெய்யான டிஜிட்டல் சரிபார்ப்பு முடிந்தது"
                })
            else:
                self.send_json_response({
                    "is_authentic": False,
                    "message_ta": "இந்த சான்றிதழ் எண் தமிழ்நாடு அரசு தரவுத்தளத்தில் இல்லை அல்லது இன்னும் ஒப்புதல் பெறவில்லை.",
                    "message_en": "Certificate not found or not yet approved in the Tamil Nadu e-District database."
                })
            return

        self.send_error(404, "Not Found")

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        
        try:
            data = json.loads(body)
        except Exception:
            data = {}

        # API: Check eligibility
        if parsed.path == "/api/check-eligibility":
            profile = data.get("profile", {})
            eligible_schemes = []
            
            for s in SCHEMES:
                ok, reasons_ta, reasons_en = evaluate_scheme_eligibility(profile, s)
                if ok:
                    scheme_copy = dict(s)
                    scheme_copy["matched_reasons_ta"] = reasons_ta
                    scheme_copy["matched_reasons_en"] = reasons_en
                    eligible_schemes.append(scheme_copy)

            total_annual_cash = 0
            for item in eligible_schemes:
                val_text = item.get("monetary_value", "")
                if "1,000 / மாதம்" in val_text:
                    total_annual_cash += 12000
                elif "1,200 / மாதம்" in val_text:
                    total_annual_cash += 14400
                elif "2,000 / மாதம்" in val_text:
                    total_annual_cash += 24000
                elif "6,000" in val_text:
                    total_annual_cash += 6000

            self.send_json_response({
                "total_eligible_count": len(eligible_schemes),
                "total_annual_cash_aid": total_annual_cash,
                "schemes": eligible_schemes,
                "applicant_summary": {
                    "aadhaar_masked": f"XXXX-XXXX-{str(profile.get('aadhaar', '1234'))[-4:]}",
                    "gender": profile.get("gender"),
                    "occupation": profile.get("occupation"),
                    "income": profile.get("annual_income")
                }
            })
            return

        # API: AI Tamil Chatbot
        if parsed.path == "/api/chat":
            user_message = data.get("message", "")
            response = process_chat_query(user_message)
            self.send_json_response(response)
            return

        self.send_error(404, "Not Found")

    def send_json_response(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
