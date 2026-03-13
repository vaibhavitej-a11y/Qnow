"""
WebSocket event handlers for real-time queue updates.
"""


def register_socket_events(socketio):
    """Register Socket.IO event handlers."""

    @socketio.on("connect")
    def handle_connect():
        print("[WS] Client connected")

    @socketio.on("disconnect")
    def handle_disconnect():
        print("[WS] Client disconnected")

    @socketio.on("join_patient")
    def handle_join_patient(data):
        """Patient joins their own room for targeted updates."""
        patient_id = data.get("patient_id")
        if patient_id:
            from flask_socketio import join_room
            join_room(patient_id)
            print(f"[WS] Patient {patient_id} joined room")

    @socketio.on("request_update")
    def handle_request_update():
        """Client requests a manual queue refresh."""
        emit_queue_update(socketio)


def emit_queue_update(socketio):
    """Broadcast queue update to all connected clients."""
    from models.store import get_queue_state, get_stats
    from services.predictor import predict_all_waits, get_average_wait

    queue_state = get_queue_state()
    waits = predict_all_waits()

    for p in queue_state:
        p["estimated_wait"] = waits.get(p["id"], 0)

    stats = get_stats()
    stats["average_wait"] = get_average_wait()

    socketio.emit("queue_updated", {
        "queue": queue_state,
        "stats": stats,
    })
