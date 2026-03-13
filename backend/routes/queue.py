"""
Queue management API endpoints.
"""

from flask import Blueprint, jsonify
from models.store import (
    get_queue_state, mark_patient_seen, mark_next_patient,
    remove_patient, get_stats, get_queue_length
)
from services.predictor import predict_all_waits, get_average_wait

queue_bp = Blueprint("queue", __name__)


@queue_bp.route("/api/queue", methods=["GET"])
def get_queue():
    """Get full queue state with positions and wait estimates."""
    queue_state = get_queue_state()
    waits = predict_all_waits()

    for p in queue_state:
        p["estimated_wait"] = waits.get(p["id"], 0)

    return jsonify(queue_state)


@queue_bp.route("/api/queue/next", methods=["POST"])
def next_patient():
    """Mark the first patient in queue as seen."""
    patient = mark_next_patient()
    if not patient:
        return jsonify({"error": "Queue is empty"}), 400
    return jsonify({"message": f"{patient['name']} marked as seen", "patient": patient})


@queue_bp.route("/api/queue/mark/<patient_id>", methods=["POST"])
def mark_seen(patient_id):
    """Mark a specific patient as seen."""
    patient = mark_patient_seen(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify({"message": f"{patient['name']} marked as seen", "patient": patient})


@queue_bp.route("/api/queue/<patient_id>", methods=["DELETE"])
def cancel_patient(patient_id):
    """Remove a patient from the queue (cancel)."""
    patient = remove_patient(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify({"message": f"{patient['name']} removed from queue", "patient": patient})


@queue_bp.route("/api/stats", methods=["GET"])
def stats():
    """Get dashboard statistics."""
    s = get_stats()
    s["average_wait"] = get_average_wait()
    return jsonify(s)
