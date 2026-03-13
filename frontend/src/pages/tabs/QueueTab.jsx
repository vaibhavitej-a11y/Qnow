import React from "react";
import { queueApi } from "../../services/api";

function QueueTab({ queue }) {
  const handleMarkSeen = async (id) => {
    try { await queueApi.markSeen(id); } catch (e) { console.error(e); }
  };
  const handleRemove = async (id) => {
    try { await queueApi.remove(id); } catch (e) { console.error(e); }
  };

  return (
    <div style={{ padding: "0" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: "800", margin: "0 0 6px 0", color: "#fff" }}>
          👥 Live Queue ({queue.length})
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem", margin: 0 }}>
          Monitor patients. Emergency cases are prioritized automatically.
        </p>
      </div>

      {queue.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "60px", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📭</div>
          <h3 style={{ color: "#fff", marginBottom: "8px" }}>Queue is empty</h3>
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Register a patient to get started</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {queue.map((patient, index) => {
            const isNext = index === 0;
            const isEmergency = patient.is_emergency;
            const statusText = isNext
              ? "You're next!"
              : `${index} patient${index > 1 ? "s" : ""} ahead`;

            const borderColor = isEmergency
              ? "rgba(255,51,102,0.5)"
              : isNext
              ? "rgba(0,195,255,0.4)"
              : "rgba(255,255,255,0.07)";

            const bgGlow = isEmergency
              ? "rgba(255,51,102,0.05)"
              : isNext
              ? "rgba(0,195,255,0.04)"
              : "transparent";

            return (
              <div
                key={patient.id}
                style={{
                  background: `rgba(13,17,28,0.8)`,
                  backgroundImage: `radial-gradient(ellipse at top left, ${bgGlow}, transparent)`,
                  border: `1px solid ${borderColor}`,
                  borderRadius: "16px",
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.3s"
                }}
              >
                {/* Position */}
                <div style={{
                  minWidth: "44px", height: "44px",
                  borderRadius: "12px",
                  background: isEmergency ? "rgba(255,51,102,0.15)" : isNext ? "rgba(0,195,255,0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${borderColor}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: "900", fontSize: "0.95rem",
                  color: isEmergency ? "#ff3366" : isNext ? "#00c3ff" : "rgba(255,255,255,0.5)"
                }}>
                  #{patient.position}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#fff" }}>{patient.name}</h3>
                    {isEmergency && (
                      <span style={{ background: "rgba(255,51,102,0.15)", border: "1px solid rgba(255,51,102,0.4)", color: "#ff3366", padding: "2px 10px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: "800" }}>
                        🚨 EMERGENCY
                      </span>
                    )}
                    {isNext && !isEmergency && (
                      <span style={{ background: "rgba(0,195,255,0.1)", border: "1px solid rgba(0,195,255,0.3)", color: "#00c3ff", padding: "2px 10px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: "800" }}>
                        NEXT
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)" }}>
                      {patient.appointment_label || "General Checkup"}
                    </span>
                    <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)" }}>
                      👨‍⚕️ Assigned: <strong style={{ color: "rgba(255,255,255,0.7)" }}>{patient.assigned_doctor_name || "Doctor"}</strong>
                    </span>
                    <span style={{ fontSize: "0.82rem", fontWeight: "600", color: isNext ? "#00c3ff" : "#00ff88" }}>
                      {statusText}
                    </span>
                  </div>
                </div>

                {/* Wait Time */}
                <div style={{ textAlign: "center", minWidth: "60px" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#fff" }}>{patient.estimated_wait}</div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: "700" }}>MIN WAIT</div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleMarkSeen(patient.id)}
                    style={{
                      background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)",
                      color: "#00ff88", padding: "8px 16px", borderRadius: "8px",
                      fontSize: "0.82rem", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap"
                    }}
                  >
                    ✓ Mark Seen
                  </button>
                  <button
                    onClick={() => handleRemove(patient.id)}
                    style={{
                      background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.2)",
                      color: "#ff3366", padding: "8px 12px", borderRadius: "8px",
                      fontSize: "0.82rem", fontWeight: "700", cursor: "pointer"
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default QueueTab;
