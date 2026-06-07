import os
import sys

# Eventlet monkey patching is required on Render (Linux production) for Socket.IO concurrency.
# Bypassed on Windows to prevent conflicts with standard library/watchdog during local dev.
if os.environ.get("RENDER") or sys.platform != "win32":
    try:
        import eventlet
        eventlet.monkey_patch()
        print("[QNow] Eventlet monkey patching applied (Production).")
    except ImportError:
        print("[QNow] Warning: eventlet not installed.")
else:
    print("[QNow] Bypassing eventlet monkey patching on local Windows development.")


"""
QNow Backend — Flask Application Entry Point.
"""


from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

from routes.patients import patients_bp
from routes.queue import queue_bp
from routes.meta import doctors_bp, hospitals_bp
from routes.triage import triage_bp
from ws.socket import init_socketio

app = Flask(__name__)
app.config["SECRET_KEY"] = "qnow_secret_mvp_v2"

# ── Setup CORS & WebSockets ──────────────────────────────────────
# Allow requests from Vite dev server explicitly
CORS(app, resources={r"/api/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# ── Register Routes ──────────────────────────────────────────────
app.register_blueprint(patients_bp)
app.register_blueprint(queue_bp)
app.register_blueprint(doctors_bp)
app.register_blueprint(hospitals_bp)
app.register_blueprint(triage_bp)

# ── Initialize WebSockets ────────────────────────────────────────
init_socketio(socketio)


@app.route("/api/health")
def health():
    return {"status": "ok", "version": "2.0"}


# ── Run ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    print(f"\n[QNow v2.0] Backend running on http://localhost:{port}\n")
    socketio.run(app, host="0.0.0.0", port=port, debug=True, allow_unsafe_werkzeug=True)

