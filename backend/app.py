"""
QNow Backend — Flask Application Entry Point.
"""

from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

from routes.patients import patients_bp
from routes.queue import queue_bp
from ws.socket import register_socket_events, emit_queue_update

# ── App Setup ─────────────────────────────────────────────────────
app = Flask(__name__)
app.config["SECRET_KEY"] = "qnow-mvp-secret"

CORS(app, resources={r"/api/*": {"origins": "*"}})

socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# ── Register Blueprints ──────────────────────────────────────────
app.register_blueprint(patients_bp)
app.register_blueprint(queue_bp)

# ── Register WebSocket Events ────────────────────────────────────
register_socket_events(socketio)


# ── Wrap queue-modifying endpoints to emit WS updates ────────────
@app.after_request
def after_request(response):
    """After any POST/DELETE that modifies the queue, broadcast update."""
    from flask import request as req
    if req.method in ("POST", "DELETE") and "/api/queue" in req.path or "/api/patients" in req.path:
        try:
            emit_queue_update(socketio)
        except Exception:
            pass  # Don't fail the request if WS broadcast fails
    return response


# ── Health Check ─────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return {"status": "ok", "service": "QNow API"}


# ── Run ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n[QNow] Backend running on http://localhost:5000\n")
    socketio.run(app, host="0.0.0.0", port=5000, debug=True, allow_unsafe_werkzeug=True)
