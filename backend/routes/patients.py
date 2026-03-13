"""
Patient management API endpoints.
"""

from flask import Blueprint, request, jsonify
from models.store import add_patient, get_patient, get_all_patients, APPOINTMENT_TYPES
from services.predictor import predict_wait_for_patient, predict_all_waits
from models.store import queue

patients_bp = Blueprint("patients", __name__)


@patients_bp.route("/api/patients", methods=["POST"])
def create_patient():
    """Add a new patient to the queue."""
    data = request.get_json()

    name = data.get("name", "").strip()
    appointment_type = data.get("appointment_type", "checkup")
    phone = data.get("phone", "")

    if not name:
        return jsonify({"error": "Patient name is required"}), 400

    if appointment_type not in APPOINTMENT_TYPES:
        return jsonify({"error": f"Invalid appointment type. Choose from: {list(APPOINTMENT_TYPES.keys())}"}), 400

    patient = add_patient(name, appointment_type, phone)

    # Calculate wait estimate
    wait_estimate = predict_wait_for_patient(patient["id"])
    patient["estimated_wait"] = wait_estimate
    patient["position"] = len(queue)

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
