"""
File-based data store for QNow MVP.
Persists patients and queue state to JSON files in backend/data/.
Data survives server restarts.
"""

import uuid
import json
import os
from datetime import datetime

# ── File Paths ─────────────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DB_FILE = os.path.join(DATA_DIR, "qnow_db.json")

# ── Appointment type base durations (minutes) ─────────────────────
APPOINTMENT_TYPES = {
    "checkup": {"label": "General Checkup", "base_minutes": 8},
    "consultation": {"label": "Consultation", "base_minutes": 15},
    "procedure": {"label": "Procedure", "base_minutes": 25},
}


# ── Persistence Helpers ────────────────────────────────────────────

def _ensure_data_dir():
    """Create the data directory if it doesn't exist."""
    os.makedirs(DATA_DIR, exist_ok=True)


def _load_db():
    """Load the database from the JSON file. Returns default structure if file doesn't exist."""
    _ensure_data_dir()
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data
        except (json.JSONDecodeError, IOError):
            pass  # Corrupted file — start fresh
    return {"patients": {}, "queue": [], "seen": []}


def _save_db():
    """Save current state to the JSON file."""
    _ensure_data_dir()
    data = {
        "patients": patients,
        "queue": queue,
        "seen": seen,
    }
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# ── Load Initial State From File ───────────────────────────────────
_initial = _load_db()
patients = _initial["patients"]       # { patient_id: { ...patient_data } }
queue = _initial["queue"]             # ordered list of patient_ids currently waiting
seen = _initial["seen"]              # list of patient_ids already seen (history)


# ── CRUD Functions ─────────────────────────────────────────────────

def add_patient(name, appointment_type, phone=""):
    """Add a new patient to the store and queue. Returns patient dict."""
    patient_id = str(uuid.uuid4())[:8]
    now = datetime.now()

    patient = {
        "id": patient_id,
        "name": name,
        "phone": phone,
        "appointment_type": appointment_type,
        "appointment_label": APPOINTMENT_TYPES.get(appointment_type, APPOINTMENT_TYPES["checkup"])["label"],
        "status": "waiting",       # waiting | in-progress | seen
        "checked_in_at": now.isoformat(),
        "seen_at": None,
        "position": None,          # will be set by get_queue_state
    }

    patients[patient_id] = patient
    queue.append(patient_id)
    _save_db()
    return patient


def mark_patient_seen(patient_id):
    """Mark a patient as seen, remove from queue, add to history."""
    if patient_id not in patients:
        return None
    if patient_id in queue:
        queue.remove(patient_id)
    patients[patient_id]["status"] = "seen"
    patients[patient_id]["seen_at"] = datetime.now().isoformat()
    if patient_id not in seen:
        seen.append(patient_id)
    _save_db()
    return patients[patient_id]


def mark_next_patient():
    """Mark the first patient in queue as seen. Returns that patient or None."""
    if not queue:
        return None
    return mark_patient_seen(queue[0])


def remove_patient(patient_id):
    """Remove patient from queue entirely (cancel)."""
    if patient_id in queue:
        queue.remove(patient_id)
    if patient_id in patients:
        patients[patient_id]["status"] = "cancelled"
        _save_db()
        return patients[patient_id]
    return None


def get_patient(patient_id):
    """Get a single patient by ID."""
    return patients.get(patient_id)


def get_all_patients():
    """Get all patients (active + seen)."""
    return list(patients.values())


def get_queue_state():
    """Get current queue with positions."""
    result = []
    for i, pid in enumerate(queue):
        p = patients.get(pid)
        if p:
            p["position"] = i + 1
            result.append(p)
    return result


def get_queue_length():
    """Current number of patients waiting."""
    return len(queue)


def get_stats():
    """Get dashboard statistics."""
    total = len(patients)
    waiting = len(queue)
    completed = len(seen)
    return {
        "total_patients": total,
        "currently_waiting": waiting,
        "completed": completed,
    }


def reset_store():
    """Reset all data (useful for testing)."""
    patients.clear()
    queue.clear()
    seen.clear()
    _save_db()
