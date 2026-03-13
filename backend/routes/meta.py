"""
Doctor and Hospital API endpoints for QNow 2.0.
"""

from flask import Blueprint, jsonify
from models.store import get_doctors_state, get_hospitals_state

doctors_bp = Blueprint("doctors", __name__, url_prefix="/api/doctors")
hospitals_bp = Blueprint("hospitals", __name__, url_prefix="/api/hospitals")

@doctors_bp.route("", methods=["GET"])
def get_all_doctors():
    """Get list of doctors and their metrics."""
    return jsonify(get_doctors_state())

@hospitals_bp.route("", methods=["GET"])
def get_all_hospitals():
    """Get list of 4 hospitals with live auto-recommended wait times."""
    return jsonify(get_hospitals_state())
