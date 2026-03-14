"""
Deterministic ESI triage fallback + Gemini AI triage endpoint.
Falls back to rule-based scoring when API quota is exhausted.
"""
from flask import Blueprint, request, jsonify
import json
import re
import os

triage_bp = Blueprint("triage", __name__)

# ── ESI Scoring Table (user-provided clinical reference) ──────────
ESI_SCORES = {
    # DOA (Bypass queue)
    "doa": (0, "DOA"), "dead on arrival": (0, "DOA"),
    "already dead": (0, "DOA"), "deceased": (0, "DOA"),

    # Critical 9-10
    "coma": (10, "Critical"), "cardiac arrest": (10, "Critical"),
    "not breathing": (10, "Critical"), "unresponsive": (10, "Critical"),
    "unconscious": (10, "Critical"), "unconsciousness": (10, "Critical"),
    "stroke": (9, "Critical"), "severe chest pain": (9, "Critical"),
    "seizure": (9, "Critical"), "convulsion": (9, "Critical"),
    "severe bleeding": (9, "Critical"), "anaphylaxis": (9, "Critical"),
    "anaphylactic": (9, "Critical"), "stopped breathing": (10, "Critical"),
    "heart attack": (10, "Critical"), "no pulse": (10, "Critical"),

    # High 7-8
    "chest pain": (8, "High"), "head injury": (8, "High"),
    "difficulty breathing": (8, "High"), "shortness of breath": (8, "High"),
    "breathless": (8, "High"), "high fever": (7, "High"),
    "fracture": (7, "High"), "broken bone": (7, "High"),
    "severe vomiting": (7, "High"), "trauma": (8, "High"),

    # Moderate 4-6
    "fever": (5, "Moderate"), "stomach pain": (5, "Moderate"),
    "abdominal pain": (5, "Moderate"), "migraine": (5, "Moderate"),
    "dizziness": (5, "Moderate"), "back pain": (4, "Moderate"),
    "sprain": (4, "Moderate"), "nausea": (4, "Moderate"),
    "vomiting": (5, "Moderate"), "rash": (4, "Moderate"),
    "urinary pain": (4, "Moderate"), "infection": (5, "Moderate"),

    # Low 1-3
    "mild headache": (3, "Low"), "headache": (3, "Low"),
    "cold": (2, "Low"), "cough": (2, "Low"), "runny nose": (2, "Low"),
    "minor cut": (2, "Low"), "scratch": (2, "Low"),
    "routine checkup": (1, "Low"), "checkup": (1, "Low"),
    "prescription": (1, "Low"), "refill": (1, "Low"),
}

WAIT_TIMES = {"DOA": 0, "Critical": 0, "High": 10, "Moderate": 30, "Low": 60, "None": 45}

DOCTOR_MAP = {
    "DOA": "doc_1",        # Administrative sign-off
    "Critical": "doc_2",   # Cardiology
    "High": "doc_2",
    "Moderate": "doc_1",   # General Medicine
    "Low": "doc_1",
}

REASONS = {
    "DOA": "Patient arrived deceased. Bypassing live triage for administrative/morgue processing.",
    "Critical": "Immediate life-threatening emergency requiring urgent intervention.",
    "High": "High-priority condition requiring prompt medical attention.",
    "Moderate": "Moderate condition — should be seen within the hour.",
    "Low": "Non-urgent condition — routine care is appropriate.",
}


def rule_based_triage(symptoms_text: str, is_emergency: bool):
    """Fast deterministic scoring using the ESI reference table."""
    text = symptoms_text.lower()
    best_score = 1
    best_severity = "Low"
    matched_reason = REASONS["Low"]

    for keyword, (score, severity) in ESI_SCORES.items():
        if keyword in text:
            if severity == "DOA" or score > best_score:
                best_score = score
                best_severity = severity
                matched_reason = REASONS[severity] if severity == "DOA" else f"Symptom '{keyword}' detected — {REASONS[severity]}"

    # Emergency toggle override: at minimum 9, UNLESS DOA
    if is_emergency and best_score < 9 and best_severity != "DOA":
        best_score = 9
        best_severity = "Critical"
        matched_reason = "Manual emergency override applied — " + REASONS["Critical"]

    return {
        "score": best_score,
        "severity": best_severity,
        "reasoning": matched_reason,
        "assigned_doctor_id": DOCTOR_MAP.get(best_severity, "doc_1"),
        "estimated_wait": WAIT_TIMES.get(best_severity, 30)
    }


def try_gemini_triage(symptoms, age, is_emergency, roster):
    """Try Gemini API. Returns None if quota exceeded or any error."""
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            generation_config={"response_mime_type": "application/json"}
        )

        prompt = f"""
You are a clinical triage AI using ESI standards. Analyze and score:

Patient Age: {age or 'Unknown'}
Symptoms: {symptoms}
Emergency Toggle: {is_emergency}

SCORING REFERENCE:
- DOA (0): dead on arrival, already dead, deceased
- CRITICAL (9-10): Coma/10, Cardiac arrest/10, Not breathing/10, Unresponsive/10, Stroke/9, Severe chest pain/9, Seizure/9, Severe bleeding/9, Anaphylaxis/9
- HIGH (7-8): Chest pain/8, Head injury/8, Difficulty breathing/8, High fever/7, Fracture/7, Severe vomiting/7
- MODERATE (4-6): Fever/5, Stomach pain/5, Migraine/5, Dizziness/5, Back pain/4, Sprain/4, Nausea/4
- LOW (1-3): Headache/3, Cold/cough/2, Minor cut/2, Checkup/1, Prescription/1

Doctor roster: {roster}

Return JSON only:
{{"score": number, "severity": "DOA"|"Critical"|"High"|"Moderate"|"Low", "reasoning": "one sentence", "assigned_doctor_id": "doc_N", "estimated_wait": minutes}}
"""
        response = model.generate_content(prompt)
        if not response.text:
            return None
        text = response.text.strip()
        if text.startswith("```"):
            text = re.sub(r"```[a-z]*\n?", "", text).replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"[Gemini Triage] Fallback to rule-based: {e}")
        return None


@triage_bp.route("/api/triage/analyze", methods=["POST"])
def analyze_triage():
    data = request.get_json() or {}
    symptoms = data.get("symptoms", "").strip()
    age = data.get("age", "")
    is_emergency = bool(data.get("is_emergency", False))

    if not symptoms:
        return jsonify({
            "score": 0, "severity": "None",
            "reasoning": "Waiting for symptoms...",
            "assigned_doctor_id": "doc_1", "estimated_wait": 0
        })

    # Build doctor roster for AI
    try:
        from models.store import DEFAULT_DOCTORS
        roster = ", ".join([f"{d['id']}={d['department']}" for d in DEFAULT_DOCTORS])
    except Exception:
        roster = "doc_1=General, doc_2=Cardiology, doc_3=Ortho, doc_4=Pediatrics"

    # Try AI first, fall back to rule-based
    result = try_gemini_triage(symptoms, age, is_emergency, roster)
    if result is None:
        result = rule_based_triage(symptoms, is_emergency)

    print(f"[Triage] '{symptoms}' -> {result['score']}/10 {result['severity']}")
    return jsonify(result)
