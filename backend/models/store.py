"""
File-based data store for QNow 2.0 MVP.
Persists patients, queue state, notifications, and doctor stats to JSON.
"""

import uuid
import json
import os
import random
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ── File Paths ─────────────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DB_FILE = os.path.join(DATA_DIR, "qnow_v2_db.json")

# ── Static Reference Data ──────────────────────────────────────────
APPOINTMENT_TYPES = {
    "checkup": {"label": "General Checkup", "base_minutes": 8},
    "consultation": {"label": "Consultation", "base_minutes": 15},
    "procedure": {"label": "Procedure", "base_minutes": 25},
}

DEFAULT_DOCTORS = [
    {"id": "doc_1", "name": "Dr. Sarah Smith", "department": "General Medicine", "icon": "👩‍⚕️", "seen_today": 0},
    {"id": "doc_2", "name": "Dr. James Chen", "department": "Cardiology", "icon": "👨‍⚕️", "seen_today": 0},
    {"id": "doc_3", "name": "Dr. Emily Davis", "department": "Orthopedics", "icon": "👩‍⚕️", "seen_today": 0},
    {"id": "doc_4", "name": "Dr. Michael Ross", "department": "Pediatrics", "icon": "👨‍⚕️", "seen_today": 0},
]

DEFAULT_HOSPITALS = [
    {"id": "hosp_1", "name": "City General Hospital", "distance_km": 2.4, "base_wait": 45},
    {"id": "hosp_2", "name": "Westside Medical Center", "distance_km": 5.1, "base_wait": 20},
    {"id": "hosp_3", "name": "Metro Health Clinic", "distance_km": 1.2, "base_wait": 85},
    {"id": "hosp_4", "name": "Valley Care Hospital", "distance_km": 8.0, "base_wait": 15},
]

import google.generativeai as genai

# Securely set up the Gemini client with the user's provided key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Configure the model to output strict JSON
generation_config = genai.types.GenerationConfig(
    response_mime_type="application/json"
)

# Initialize the Gemini Flash model for speed/cost balance
model = genai.GenerativeModel("gemini-2.5-flash", generation_config=generation_config)

def assign_doctor_with_llm(patient_age, symptoms):
    """
    Real AI Triage using the Gemini LLM.
    Returns: (doc_id, is_emergency, reasoning)
    """
    # Create a string representation of the roster for the prompt
    roster = "\n".join([
        f"- {d['id']} ({d['department']}): {d['name']}" for d in DEFAULT_DOCTORS
    ])
    
    prompt = f"""
    You are QNow, an advanced hospital triage AI. Review the patient data and assign them to the most appropriate doctor ID from the list provided below.
    If the symptoms imply a life-threatening emergency (e.g. heart attack, stroke, severe bleeding, difficulty breathing), set 'is_emergency' to true.
    
    Patient Age: {patient_age if patient_age else 'Unknown'}
    Patient Symptoms: {symptoms}
    
    Available Doctors Roster:
    {roster}
    
    Instructions:
    1. Analyze the symptoms and age.
    2. Pick the *single best* doctor ID from the roster. Default to 'doc_1' (General Medicine) if unsure.
    3. Determine if this is a strict medical emergency.
    4. Provide a very brief, 1-sentence medical reasoning for your choices.
    
    Return EXACTLY this JSON format and nothing else:
    {{
      "assigned_doctor_id": "string",
      "is_emergency": boolean,
      "reasoning": "string"
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        decision = json.loads(response.text)
        
        doc_id = decision.get("assigned_doctor_id", "doc_1")
        # Ensure the AI selected a valid doctor, otherwise fallback
        if doc_id not in [d["id"] for d in DEFAULT_DOCTORS]:
            doc_id = "doc_1"
            
        is_emergency = decision.get("is_emergency", False)
        reasoning = decision.get("reasoning", "Assigned by AI Triage.")
        
        return doc_id, is_emergency, reasoning
        
    except Exception as e:
        print(f"[AI Triage Error] Falling back to default: {e}")
        # Safe fallback if API limit hit or network fails
        return "doc_1", False, "Fallback: AI temporarily unavailable."


# ── Persistence Helpers ────────────────────────────────────────────

def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)

def _load_db():
    _ensure_data_dir()
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {
        "patients": {},
        "queue": [],
        "seen": [],
        "notifications": [],
        "doctors": {d["id"]: d.copy() for d in DEFAULT_DOCTORS}
    }

def _save_db():
    _ensure_data_dir()
    data = {"patients": patients, "queue": queue, "seen": seen, "notifications": notifications, "doctors": doctors}
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# ── Load Initial State ─────────────────────────────────────────────
_initial = _load_db()
patients = _initial["patients"]
queue = _initial["queue"]
seen = _initial["seen"]
notifications = _initial["notifications"]
doctors = _initial.get("doctors", {d["id"]: d.copy() for d in DEFAULT_DOCTORS})

# ── Notifications ──────────────────────────────────────────────────

def add_notification(message, type="info"):
    """Add a notification to the feed (max 20)."""
    n = {
        "id": str(uuid.uuid4())[:8],
        "message": message,
        "type": type,
        "time": datetime.now().isoformat()
    }
    notifications.insert(0, n)
    if len(notifications) > 20:
        notifications.pop()
    _save_db()


# ── Queue & Patient Logic ──────────────────────────────────────────

def add_patient(name, age, phone, symptoms, appointment_type, is_emergency=False):
    """Add new patient. AI Triage decides emergency status and doctor assignment."""
    patient_id = str(uuid.uuid4())[:8]
    now = datetime.now()
    
    # AI Triage Process
    doc_id, ai_is_emergency, ai_reasoning = assign_doctor_with_llm(age, symptoms)

    patient = {
        "id": patient_id,
        "name": name,
        "age": age,
        "phone": phone,
        "symptoms": symptoms,
        "appointment_type": appointment_type,
        "appointment_label": APPOINTMENT_TYPES.get(appointment_type, APPOINTMENT_TYPES["checkup"])["label"],
        "is_emergency": ai_is_emergency,
        "assigned_doctor": doc_id,
        "ai_reasoning": ai_reasoning,
        "status": "waiting",
        "checked_in_at": now.isoformat(),
        "seen_at": None,
        "position": None,
    }

    patients[patient_id] = patient

    if ai_is_emergency:
        # Jump ahead of all non-emergencies
        insert_idx = 0
        while insert_idx < len(queue) and patients[queue[insert_idx]].get("is_emergency", False):
            insert_idx += 1
        queue.insert(insert_idx, patient_id)
        
        doc_name = doctors[doc_id]["name"]
        add_notification(f"🚨 AI TRIAGE ALERT: {name} flagged as Emergency -> {doc_name}", "urgent")
    else:
        queue.append(patient_id)
        doc_name = doctors[doc_id]["name"]
        add_notification(f"📝 AI Triage: {name} registered -> {doc_name}", "info")

    _save_db()
    return patient


def mark_patient_seen(patient_id):
    """Mark as seen, update doctor stats, add to history."""
    if patient_id not in patients:
        return None
    
    p = patients[patient_id]
    
    if patient_id in queue:
        queue.remove(patient_id)
        
    p["status"] = "seen"
    p["seen_at"] = datetime.now().isoformat()
    
    if patient_id not in seen:
        seen.append(patient_id)
        
    # Increment doctor stats
    doc_id = p.get("assigned_doctor")
    if doc_id and doc_id in doctors:
        doctors[doc_id]["seen_today"] += 1

    add_notification(f"✅ {p['name']} was marked as seen", "success")
    _save_db()
    return p

def mark_patient_deceased(patient_id):
    """Mark as deceased (DOA/Deteriorated), remove from queue, do NOT update doctor 'seen' stats."""
    if patient_id not in patients:
        return None
        
    p = patients[patient_id]
    
    if patient_id in queue:
        queue.remove(patient_id)
        
    p["status"] = "deceased"
    p["seen_at"] = datetime.now().isoformat()
    
    # Still keep in the 'seen/history' list for hospital audit trails
    if patient_id not in seen:
        seen.append(patient_id)
        
    add_notification(f"⚫ SYSTEM ALERT: Patient {p['name']} status updated to Deceased. Doctor capacity freed.", "urgent")
    _save_db()
    return p


def mark_next_patient():
    if not queue:
        return None
    return mark_patient_seen(queue[0])


def remove_patient(patient_id):
    if patient_id in queue:
        queue.remove(patient_id)
    if patient_id in patients:
        patients[patient_id]["status"] = "cancelled"
        add_notification(f"❌ {patients[patient_id]['name']} was removed from queue", "warning")
        _save_db()
        return patients[patient_id]
    return None


# ── Retrievers ─────────────────────────────────────────────────────

def get_patient(patient_id):
    return patients.get(patient_id)

def get_all_patients():
    return list(patients.values())

def get_queue_state():
    result = []
    for i, pid in enumerate(queue):
        p = patients.get(pid)
        if p:
            p["position"] = i + 1
            result.append(p)
    return result

def get_doctors_state():
    docs = list(doctors.values())
    # Add currently waiting count explicitly
    for d in docs:
        d["currently_waiting"] = sum(1 for pid in queue if patients[pid].get("assigned_doctor") == d["id"])
    return docs

def get_notifications():
    return notifications

def get_hospitals_state():
    """Return live multi-hospital wait times with randomization jitter."""
    results = []
    best = None
    min_time = 999
    
    for h in DEFAULT_HOSPITALS:
        # Jitter base wait by -5 to +15 mins to simulate live changes
        jitter = random.randint(-5, 15)
        current_wait = max(0, h["base_wait"] + jitter)
        
        h_state = h.copy()
        h_state["current_wait_mins"] = current_wait
        
        if current_wait < min_time:
            min_time = current_wait
            best = h["id"]
            
        results.append(h_state)
        
    # Mark the recommended one
    for r in results:
        r["is_recommended"] = (r["id"] == best)
        
    return results

def get_stats():
    total = len(patients)
    waiting = len(queue)
    completed = len(seen)
    
    # Simple Doctor Utilization %
    # Assume capacity is 20 patients per doctor per day
    total_capacity = len(doctors) * 20
    utilization = min(100, round((completed / total_capacity) * 100)) if total_capacity > 0 else 0
    
    return {
        "total_patients": total,
        "currently_waiting": waiting,
        "completed": completed,
        "doctor_utilization_pct": utilization
    }

def reset_store():
    patients.clear()
    queue.clear()
    seen.clear()
    notifications.clear()
    for d in doctors.values():
        d["seen_today"] = 0
    _save_db()
