import React from "react";

function DashboardTab({ stats, notifications }) {
  if (!stats) return (
    <div style={{ color: "rgba(255,255,255,0.5)", padding: "40px", textAlign: "center" }}>
      Loading stats...
    </div>
  );

  const statCards = [
    { icon: "👥", val: stats.total_patients ?? 0, label: "Total Patients Today", color: "#00c3ff" },
    { icon: "⏳", val: stats.currently_waiting ?? 0, label: "Currently Waiting", color: "#ffcc00" },
    { icon: "📈", val: `${stats.doctor_utilization_pct ?? 0}%`, label: "Doctor Utilization", color: "#00ff88" },
    { icon: "✅", val: stats.completed ?? 0, label: "Patients Seen", color: "#a855f7" },
  ];

  const getNotifColor = (type) => {
    if (type === "emergency") return { bg: "rgba(255,51,102,0.08)", border: "rgba(255,51,102,0.2)", txt: "#ff3366" };
    if (type === "seen") return { bg: "rgba(0,255,136,0.06)", border: "rgba(0,255,136,0.15)", txt: "rgba(255,255,255,0.7)" };
    return { bg: "transparent", border: "rgba(255,255,255,0.05)", txt: "rgba(255,255,255,0.6)" };
  };

  return (
    <div style={{ padding: "0" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: "800", margin: "0 0 6px 0", color: "#fff" }}>
          📊 Dashboard
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem", margin: 0 }}>
          High-level statistics and live system feed
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {statCards.map(({ icon, val, label, color }) => (
          <div key={label} style={{
            background: "rgba(13,17,28,0.8)",
            border: `1px solid ${color}22`,
            borderRadius: "16px", padding: "24px 20px",
            backdropFilter: "blur(12px)",
            boxShadow: `0 0 20px ${color}11`
          }}>
            <div style={{ fontSize: "1.6rem", marginBottom: "12px" }}>{icon}</div>
            <div style={{ fontSize: "2.4rem", fontWeight: "900", color: color, lineHeight: 1, marginBottom: "8px" }}>
              {val}
            </div>
            <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "rgba(255,255,255,0.45)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Notification Feed */}
      <div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#fff", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00ff88", display: "inline-block", boxShadow: "0 0 8px #00ff88", animation: "pulse 2s infinite" }} />
          Live Notification Feed
        </h3>
        <div style={{
          background: "rgba(13,17,28,0.8)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px", padding: "8px",
          backdropFilter: "blur(12px)",
          maxHeight: "400px", overflowY: "auto"
        }}>
          {notifications && notifications.length > 0 ? (
            notifications.map((n) => {
              const c = getNotifColor(n.type);
              return (
                <div key={n.id} style={{
                  display: "flex", gap: "12px", alignItems: "flex-start",
                  padding: "12px 16px", borderRadius: "10px",
                  background: c.bg, borderBottom: `1px solid ${c.border}`,
                  marginBottom: "2px"
                }}>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", paddingTop: "2px", minWidth: "55px" }}>
                    {new Date(n.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span style={{ fontSize: "0.88rem", color: c.txt, lineHeight: "1.4" }}>
                    {n.message}
                  </span>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardTab;
