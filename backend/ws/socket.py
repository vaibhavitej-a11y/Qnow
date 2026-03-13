"""
WebSocket event handlers for real-time QNow 2.0 updates.
"""

from flask_socketio import emit
from models.store import get_queue_state, get_stats, get_notifications, get_doctors_state, get_hospitals_state
from services.predictor import predict_all_waits

# Keep a global reference to socketio so routes can broadcast reliably
_socketio = None

def init_socketio(socketio):
    global _socketio
    _socketio = socketio
    
    @socketio.on("connect")
    def handle_connect():
        print("[WS] Client connected")
        # Send everything on initial connect
        emit_all_state()

    @socketio.on("disconnect")
    def handle_disconnect():
        print("[WS] Client disconnected")


def emit_all_state():
    """Emit the entire system state to whoever asks (or broadcast)."""
    if not _socketio:
        return
        
    q_state = get_queue_state()
    waits = predict_all_waits()
    for p in q_state:
        p["estimated_wait"] = waits.get(p["id"], 0)

    _socketio.emit("queue_updated", q_state)
    _socketio.emit("meta_updated", {"stats": get_stats(), "notifications": get_notifications()})
    _socketio.emit("doctors_updated", get_doctors_state())
    _socketio.emit("hospitals_updated", get_hospitals_state())

def trigger_update():
    """Triggered by HTTP routes when data mutates."""
    emit_all_state()
