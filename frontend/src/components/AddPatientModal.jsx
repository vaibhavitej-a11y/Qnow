import { useState } from 'react';
import './AddPatientModal.css';

const APPOINTMENT_TYPES = [
  { value: 'checkup', label: '🩺 General Checkup', desc: '~8 min' },
  { value: 'consultation', label: '💬 Consultation', desc: '~15 min' },
  { value: 'procedure', label: '🔬 Procedure', desc: '~25 min' },
];

export default function AddPatientModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('checkup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter patient name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onAdd(name.trim(), type);
      setName('');
      setType('checkup');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card-static animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Patient</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="patientName">Patient Name</label>
            <input
              id="patientName"
              type="text"
              placeholder="Enter full name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Appointment Type</label>
            <div className="type-selector">
              {APPOINTMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`type-option ${type === t.value ? 'type-active' : ''}`}
                  onClick={() => setType(t.value)}
                >
                  <span className="type-label">{t.label}</span>
                  <span className="type-desc">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Adding...' : '+ Add to Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
