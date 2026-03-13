"""
Patient management API endpoints for QNow 2.0.
"""

from flask import Blueprint, request, jsonify
from models.store import add_patient, get_patient, get_all_patients, APPOINTMENT_TYPES, queue
from services.predictor import predict_wait_for_patient, predict_all_waits
from ws.socket import trigger_update

patients_bp = Blueprint("patients", __name__)


@patients_bp.route("/api/patients", methods=["POST"])
def create_patient():
    """Add a new patient to the queue (with Emergency and Symptoms)."""
    data = request.get_json()

    name = data.get("name", "").strip()
    age = data.get("age", "")
    phone = data.get("phone", "")
    symptoms = data.get("symptoms", "")
    appointment_type = data.get("appointment_type", "checkup")
    
    # Ensure boolean
    is_emergency = data.get("is_emergency", False)
    if isinstance(is_emergency, str):
        is_emergency = is_emergency.lower() == "true"

    if not name:
        return jsonify({"error": "Patient name is required"}), 400

    if appointment_type not in APPOINTMENT_TYPES:
        appointment_type = "checkup"

    patient = add_patient(name, age, phone, symptoms, appointment_type, is_emergency)

    # Calculate wait estimate
    wait_estimate = predict_wait_for_patient(patient["id"])
    patient["estimated_wait"] = wait_estimate
    patient["position"] = queue.index(patient["id"]) + 1 if patient["id"] in queue else None

    # Broadcast new state
    trigger_update()

    return jsonify(patient), 201


@patients_bp.route("/api/patients", methods=["GET"])
def list_patients():
    """List all patients (for dashboard)."""
    all_patients = get_all_patients()
    waits = predict_all_waits()

    for p in all_patients:
        p["estimated_wait"] = waits.get(p["id"], 0)
        if p["id"] in queue:
            p["position"] = queue.index(p["id"]) + 1
        else:
            p["position"] = None

    return jsonify(all_patients)


@patients_bp.route("/api/patients/<patient_id>", methods=["GET"])
def get_patient_details(patient_id):
    """Get a single patient's details with queue position and wait estimate."""
    patient = get_patient(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    patient["estimated_wait"] = predict_wait_for_patient(patient_id)

    if patient_id in queue:
        patient["position"] = queue.index(patient_id) + 1
        patient["total_in_queue"] = len(queue)
    else:
        patient["position"] = None
        patient["total_in_queue"] = len(queue)

    return jsonify(patient)


@patients_bp.route("/api/appointment-types", methods=["GET"])
def list_appointment_types():
    """Return available appointment types."""
    return jsonify(APPOINTMENT_TYPES)
