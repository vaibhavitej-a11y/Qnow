import React from "react";

function MultiHospitalTab({ hospitals }) {
  if (!hospitals || hospitals.length === 0) {
    return (
      <div style={{ color: "rgba(255,255,255,0.5)", padding: "40px", textAlign: "center" }}>
        Loading hospital data...
      </div>
    );
  }

  return (
    <div style={{ padding: "0" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: "800", margin: "0 0 6px 0", color: "#fff" }}>
          🏥 Multi-Hospital View
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem", margin: 0 }}>
          Live wait times across the city network. Data artificially jitters every 30s.
        </p>
      </div>

      {/* Hospital Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
        {hospitals.map((h) => {
          const isRec = h.is_recommended;
          const bgGlow = isRec ? "rgba(0,255,136,0.06)" : "transparent";
          const borderColor = isRec ? "rgba(0,255,136,0.5)" : "rgba(255,255,255,0.08)";

          return (
            <div
              key={h.id}
              style={{
                position: "relative",
                background: `linear-gradient(145deg, rgba(13,17,28,0.9), rgba(13,17,28,0.7))`,
                backgroundImage: `radial-gradient(circle at top right, ${bgGlow}, transparent)`,
                border: `1px solid ${borderColor}`,
                borderRadius: "20px",
                padding: "24px",
                backdropFilter: "blur(12px)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                boxShadow: isRec ? "0 0 24px rgba(0,255,136,0.15)" : "none",
                transition: "all 0.3s"
              }}
            >
              {/* Badge */}
              {isRec && (
                <div style={{
                  position: "absolute", top: "-12px", right: "24px",
                  background: "linear-gradient(90deg, #00ff88, #00c3ff)",
                  color: "#000", fontWeight: "900", fontSize: "0.75rem", letterSpacing: "1px",
                  padding: "6px 14px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,255,136,0.4)"
                }}>
                  ⚡ FASTEST
                </div>
              )}

              {/* Hospital Info & Distance */}
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "1.3rem", fontWeight: "800", color: "#fff" }}>
                  {h.name}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", fontWeight: "600" }}>
                  <span style={{ color: "#ff3366" }}>📍</span> {h.distance_km} km away
                </div>
              </div>

              {/* Wait Time & Action */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "8px" }}>
                <div>
                  <div style={{ fontSize: "2.4rem", fontWeight: "900", color: isRec ? "#00ff88" : "#ffcc00", lineHeight: "1" }}>
                    {h.current_wait_mins}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", fontWeight: "700", letterSpacing: "0.5px", marginTop: "4px" }}>
                    MINS WAIT
                  </div>
                </div>

                <button style={{
                  background: isRec ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${isRec ? "rgba(0,255,136,0.3)" : "rgba(255,255,255,0.1)"}`,
                  color: isRec ? "#00ff88" : "#fff",
                  padding: "10px 20px", borderRadius: "10px",
                  fontSize: "0.85rem", fontWeight: "700", cursor: "pointer",
                  transition: "all 0.2s"
                }}>
                  Navigate ↗
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MultiHospitalTab;
