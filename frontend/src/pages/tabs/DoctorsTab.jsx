import React from "react";

const DOCTOR_COLORS = ["#00c3ff", "#00ff88", "#a855f7", "#ff6600"];

function DoctorsTab({ doctors }) {
  if (!doctors || doctors.length === 0) {
    return (
      <div style={{ color: "rgba(255,255,255,0.5)", padding: "40px", textAlign: "center" }}>
        Loading doctors...
      </div>
    );
  }

  return (
    <div style={{ padding: "0" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: "800", margin: "0 0 6px 0", color: "#fff" }}>
          👨‍⚕️ Doctors Availability
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem", margin: 0 }}>
          Live tracking of capacity and patient load per doctor
        </p>
      </div>

      {/* Doctors Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {doctors.map((d, i) => {
          const color = DOCTOR_COLORS[i % DOCTOR_COLORS.length];
          const utilPct = d.currently_waiting > 0
            ? Math.min(100, (d.currently_waiting / (d.currently_waiting + d.seen_today + 1)) * 100)
            : 0;

          return (
            <div key={d.id} style={{
              background: "rgba(13,17,28,0.8)",
              border: `1px solid ${color}22`,
              borderRadius: "20px", padding: "24px",
              backdropFilter: "blur(12px)",
              boxShadow: `0 0 20px ${color}0a`
            }}>
              {/* Doctor profile */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
                <div style={{
                  width: "52px", height: "52px", borderRadius: "14px",
                  background: `${color}15`, border: `1px solid ${color}33`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.6rem"
                }}>
                  {d.icon || "👨‍⚕️"}
                </div>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "1.05rem", color: "#fff" }}>{d.name}</div>
                  <div style={{ fontSize: "0.8rem", color: color, marginTop: "2px", fontWeight: "600" }}>{d.department}</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <div style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px", padding: "14px", textAlign: "center"
                }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: "900", color: d.currently_waiting > 0 ? "#ffcc00" : "rgba(255,255,255,0.3)" }}>
                    {d.currently_waiting}
                  </div>
                  <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: "0.5px", marginTop: "4px" }}>
                    WAITING
                  </div>
                </div>
                <div style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "12px", padding: "14px", textAlign: "center"
                }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#00ff88" }}>
                    {d.seen_today}
                  </div>
                  <div style={{ fontSize: "0.68rem", fontWeight: "700", color: "rgba(255,255,255,0.4)", letterSpacing: "0.5px", marginTop: "4px" }}>
                    SEEN TODAY
                  </div>
                </div>
              </div>

              {/* Utilization bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: "700" }}>UTILIZATION</span>
                  <span style={{ fontSize: "0.72rem", color: color, fontWeight: "700" }}>{Math.round(utilPct)}%</span>
                </div>
                <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${utilPct}%`,
                    background: color, borderRadius: "3px",
                    transition: "width 0.5s ease"
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DoctorsTab;
