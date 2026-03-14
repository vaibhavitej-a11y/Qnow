import React, { useState, useEffect } from "react";
import { patientApi } from "../../services/api";

function RegisterTab() {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    phone: "",
    symptoms: "",
    appointment_type: "checkup",
    is_emergency: false
  });

  const [triageData, setTriageData] = useState({
    score: 0,
    severity: "None",
    reasoning: "Type symptoms to get AI triage score...",
    assigned_doctor_id: null,
    estimated_wait: 0
  });

  const [loading, setLoading] = useState(false);
  const [triageLoading, setTriageLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Debounced real-time triage
  useEffect(() => {
    if (formData.symptoms.length < 3) return;
    const timer = setTimeout(async () => {
      setTriageLoading(true);
      try {
        const result = await patientApi.analyzeTriage(
          formData.symptoms,
          formData.age,
          formData.is_emergency
        );
        if (result && result.score !== undefined) {
          setTriageData(result);
        }
      } catch (err) {
        console.error("Triage Analysis failed:", err);
      } finally {
        setTriageLoading(false);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [formData.symptoms, formData.age, formData.is_emergency]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError("Patient name is required"); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      const p = await patientApi.add({ ...formData, age: parseInt(formData.age, 10) || null });
      setSuccess(`✅ ${p.name} added to queue!`);
      setFormData({ name: "", age: "", phone: "", symptoms: "", appointment_type: "checkup", is_emergency: false });
      setTriageData({ score: 0, severity: "None", reasoning: "Type symptoms to get AI triage score...", assigned_doctor_id: null, estimated_wait: 0 });
    } catch (err) {
      setError(err.message || "Failed to add patient");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity?.toLowerCase()) {
      case "doa": return "#888888";
      case "critical": return "#ff3366";
      case "high": return "#ff6600";
      case "moderate": return "#ffcc00";
      case "low": return "#00ff88";
      default: return "rgba(255,255,255,0.3)";
    }
  };

  const scoreColor = getSeverityColor(triageData.severity);

  return (
    <div style={{ padding: "0" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: "800", margin: "0 0 6px 0", color: "#fff" }}>
          Register New Patient
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem", margin: 0 }}>
          AI triage scoring · smart department routing · predictive analytics
        </p>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "28px", alignItems: "start" }}>

        {/* LEFT: Form */}
        <div style={{
          background: "rgba(13,17,28,0.8)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          padding: "32px",
          backdropFilter: "blur(12px)"
        }}>
          {error && <div style={{ background: "rgba(255,51,102,0.12)", border: "1px solid rgba(255,51,102,0.3)", color: "#ff3366", padding: "12px 16px", borderRadius: "10px", marginBottom: "20px", fontSize: "0.9rem" }}>⚠ {error}</div>}
          {success && <div style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88", padding: "12px 16px", borderRadius: "10px", marginBottom: "20px", fontSize: "0.9rem" }}>{success}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Name + Age Row */}
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", letterSpacing: "1px", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>FULL NAME *</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", letterSpacing: "1px", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>AGE</label>
                <input
                  type="number"
                  placeholder="e.g. 42"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", letterSpacing: "1px", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>PHONE / WHATSAPP</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* Symptoms */}
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: "700", letterSpacing: "1px", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>SYMPTOMS *</label>
              <textarea
                rows="4"
                placeholder="Describe symptoms... (AI will analyze in real-time)"
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                required
                style={{ ...inputStyle, resize: "vertical", lineHeight: "1.5" }}
              />
            </div>

            {/* Emergency Toggle */}
            <label style={{ display: "flex", alignItems: "center", gap: "14px", cursor: "pointer", padding: "14px 16px", background: formData.is_emergency ? "rgba(255,51,102,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${formData.is_emergency ? "rgba(255,51,102,0.4)" : "rgba(255,255,255,0.06)"}`, borderRadius: "12px", transition: "all 0.3s" }}>
              <div
                onClick={() => setFormData({ ...formData, is_emergency: !formData.is_emergency })}
                style={{
                  width: "46px", height: "24px", borderRadius: "12px",
                  background: formData.is_emergency ? "#ff3366" : "#333",
                  position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.3s"
                }}
              >
                <div style={{
                  position: "absolute", top: "3px",
                  left: formData.is_emergency ? "25px" : "3px",
                  width: "18px", height: "18px",
                  borderRadius: "50%", background: "white",
                  transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.4)"
                }} />
              </div>
              <div>
                <div style={{ color: formData.is_emergency ? "#ff3366" : "rgba(255,255,255,0.7)", fontWeight: "700", fontSize: "0.95rem" }}>
                  🚨 Emergency — Queue Priority Override
                </div>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                  Enables this patient to jump to the front of the queue
                </div>
              </div>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #1e70d1, #00c3ff)",
                color: "white", border: "none", borderRadius: "12px",
                padding: "16px", fontSize: "1.05rem", fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 8px 24px rgba(0,195,255,0.25)",
                transition: "all 0.2s"
              }}
            >
              {loading ? "Processing AI Triage..." : "Register Patient →"}
            </button>
          </form>
        </div>

        {/* RIGHT: AI Triage Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Score Card */}
          <div style={{
            background: "rgba(13,17,28,0.8)",
            border: `1px solid ${triageData.score > 0 ? scoreColor + "44" : "rgba(255,255,255,0.08)"}`,
            borderRadius: "20px", padding: "24px",
            backdropFilter: "blur(12px)",
            boxShadow: triageData.score > 0 ? `0 0 24px ${scoreColor}22` : "none",
            transition: "all 0.5s ease"
          }}>
            <div style={{ fontSize: "0.72rem", fontWeight: "700", letterSpacing: "1px", color: "rgba(255,255,255,0.5)", marginBottom: "20px" }}>
              🏥 AI TRIAGE SCORE
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "4.5rem", fontWeight: "900", color: triageData.severity === "DOA" ? "rgba(255,255,255,0.4)" : (triageData.score > 0 ? scoreColor : "rgba(255,255,255,0.2)"), lineHeight: "1", transition: "color 0.5s" }}>
                  {triageLoading ? "·" : triageData.score}
                </span>
                <span style={{ fontSize: "1.5rem", color: "rgba(255,255,255,0.3)" }}>/10</span>
              </div>
              {(triageData.score > 0 || triageLoading) && (
                <div style={{
                  padding: "6px 14px", borderRadius: "8px",
                  fontSize: "0.78rem", fontWeight: "900", letterSpacing: "1px",
                  background: triageLoading ? "rgba(255,255,255,0.05)" : `${scoreColor}20`,
                  color: triageLoading ? "rgba(255,255,255,0.4)" : scoreColor,
                  border: `1px solid ${triageLoading ? "rgba(255,255,255,0.1)" : scoreColor + "55"}`,
                  transition: "all 0.5s"
                }}>
                  {triageLoading ? "ANALYZING..." : triageData.severity.toUpperCase()}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div style={{ height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden", marginBottom: "16px" }}>
              <div style={{
                height: "100%", borderRadius: "3px",
                width: `${triageData.score * 10}%`,
                background: scoreColor,
                transition: "width 0.5s ease, background 0.5s ease"
              }} />
            </div>

            <div style={{ fontSize: "0.85rem", color: triageLoading ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.6)", lineHeight: "1.5", fontStyle: triageLoading ? "italic" : "normal" }}>
              {triageLoading ? "AI is analyzing symptoms using ESI standards..." : triageData.reasoning}
            </div>
          </div>

          {/* Smart Assignment Card */}
          <div style={{
            background: "rgba(13,17,28,0.8)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px", padding: "24px",
            backdropFilter: "blur(12px)"
          }}>
            <div style={{ fontSize: "0.72rem", fontWeight: "700", letterSpacing: "1px", color: "rgba(255,255,255,0.5)", marginBottom: "20px" }}>
              📋 SMART ASSIGNMENT
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <span style={{ fontSize: "2.2rem" }}>🩺</span>
              <div>
                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#00ff88" }}>Auto-Assigned by AI</div>
                <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)" }}>Based on symptom analysis</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              {[
                { val: triageData.score > 0 ? `${triageData.estimated_wait} min` : "—", lbl: "EST. WAIT" },
                { val: triageData.severity !== "None" ? triageData.severity : "—", lbl: "SEVERITY" },
                { val: triageData.score > 0 ? `${triageData.score}/10` : "—", lbl: "TRIAGE SCORE" },
                { val: formData.is_emergency ? "YES" : "NO", lbl: "EMERGENCY" }
              ].map(({ val, lbl }) => (
                <div key={lbl} style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: "10px", padding: "12px", textAlign: "center"
                }}>
                  <div style={{ fontSize: "1rem", fontWeight: "700", color: "#fff", marginBottom: "4px" }}>{val}</div>
                  <div style={{ fontSize: "0.62rem", fontWeight: "700", color: "rgba(255,255,255,0.35)", letterSpacing: "0.5px" }}>{lbl}</div>
                </div>
              ))}
            </div>

            {triageData.score >= 9 && triageData.severity !== "DOA" && (
              <div style={{ background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "0.82rem", color: "#ff3366", fontWeight: "600" }}>
                🚨 Critical — Immediate medical attention required
              </div>
            )}
            {triageData.severity === "DOA" && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 14px", fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", fontWeight: "600" }}>
                ⚫ DOA — Route directly to administrative/morgue processing
              </div>
            )}
            {triageData.score >= 7 && triageData.score < 9 && (
              <div style={{ background: "rgba(255,102,0,0.1)", border: "1px solid rgba(255,102,0,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "0.82rem", color: "#ff6600", fontWeight: "600" }}>
                ⚠ High priority — See doctor soon
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px",
  padding: "14px 16px", color: "#fff", fontSize: "0.95rem",
  outline: "none", boxSizing: "border-box",
  transition: "border-color 0.2s",
  fontFamily: "inherit"
};

export default RegisterTab;
