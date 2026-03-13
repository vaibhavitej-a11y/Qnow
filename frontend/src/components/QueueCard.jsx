import './QueueCard.css';

const TYPE_COLORS = {
  checkup: { bg: 'rgba(6, 214, 160, 0.12)', color: '#06d6a0', label: 'Checkup' },
  consultation: { bg: 'rgba(0, 180, 216, 0.12)', color: '#00b4d8', label: 'Consultation' },
  procedure: { bg: 'rgba(131, 56, 236, 0.12)', color: '#8338ec', label: 'Procedure' },
};

export default function QueueCard({ patient, onMarkSeen, onRemove, showActions = true }) {
  const type = TYPE_COLORS[patient.appointment_type] || TYPE_COLORS.checkup;
  const isNext = patient.position === 1;

  return (
    <div className={`queue-card glass-card ${isNext ? 'queue-card-next' : ''}`}>
      <div className="queue-card-position">
        <span className="position-number">#{patient.position}</span>
      </div>

      <div className="queue-card-info">
        <div className="queue-card-header">
          <h3 className="patient-name">{patient.name}</h3>
          <span
            className="appointment-badge"
            style={{ background: type.bg, color: type.color }}
          >
            {type.label}
          </span>
        </div>
        <div className="queue-card-meta">
          <span className="meta-item">
            🕐 ~{patient.estimated_wait || 0} min wait
          </span>
          <span className="meta-item meta-divider">•</span>
          <span className="meta-item">
            Checked in {new Date(patient.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {showActions && (
        <div className="queue-card-actions">
          <button className="btn-success" onClick={() => onMarkSeen(patient.id)}>
            ✓ Mark Seen
          </button>
          <button className="btn-danger" onClick={() => onRemove(patient.id)}>
            ✕ Remove
          </button>
        </div>
      )}

      {isNext && <div className="next-indicator">NEXT</div>}
    </div>
  );
}
