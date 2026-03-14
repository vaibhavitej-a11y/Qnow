"""
Queue management API endpoints for QNow 2.0.
"""

from flask import Blueprint, jsonify
from models.store import (
    get_queue_state, mark_patient_seen, mark_next_patient,
    remove_patient, get_stats, get_notifications, mark_patient_deceased
)
from services.predictor import predict_all_waits
from ws.socket import trigger_update

queue_bp = Blueprint("queue", __name__)


@queue_bp.route("/api/queue", methods=["GET"])
def get_queue():
    """Get the current live queue with estimated wait times."""
    q_state = get_queue_state()
    waits = predict_all_waits()

    for p in q_state:
        p["estimated_wait"] = waits.get(p["id"], 0)

    return jsonify(q_state)


@queue_bp.route("/api/queue/stats", methods=["GET"])
def get_queue_stats():
    """Get high-level dashboard metrics and notifications."""
    return jsonify({
        "stats": get_stats(),
        "notifications": get_notifications()
    })


@queue_bp.route("/api/queue/mark-seen/<patient_id>", methods=["POST"])
def api_mark_seen(patient_id):
    """Mark a specific patient as seen."""
    patient = mark_patient_seen(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    trigger_update()
    return jsonify({"message": "Patient marked as seen", "patient": patient})


@queue_bp.route("/api/queue/mark-deceased/<patient_id>", methods=["POST"])
def api_mark_deceased(patient_id):
    """Mark a specific patient as deceased (DOA)."""
    patient = mark_patient_deceased(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    trigger_update()
    return jsonify({"message": "Patient marked as deceased", "patient": patient})


@queue_bp.route("/api/queue/next", methods=["POST"])
def api_next_patient():
    """Mark the first patient in the queue as seen."""
    patient = mark_next_patient()
    if not patient:
        return jsonify({"error": "Queue is empty"}), 400

    trigger_update()
    return jsonify({"message": "Next patient marked as seen", "patient": patient})


@queue_bp.route("/api/queue/<patient_id>", methods=["DELETE"])
def api_remove_patient(patient_id):
    """Remove a patient from the queue without seeing them."""
    patient = remove_patient(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    trigger_update()
    return jsonify({"message": "Patient removed successfully", "patient": patient})
