import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getPatient, connectSocket, joinPatientRoom } from '../services/api';
import './PatientTracker.css';

export default function PatientTracker() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPatient = useCallback(async () => {
    try {
      const data = await getPatient(id);
      setPatient(data);
      setError('');
    } catch (err) {
      setError('Patient not found or link is invalid.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPatient();

    // WebSocket for real-time
    const socket = connectSocket(() => {
      fetchPatient();
    });
    joinPatientRoom(id);

    // Fallback polling
    const interval = setInterval(fetchPatient, 4000);
    return () => clearInterval(interval);
  }, [fetchPatient, id]);

  if (loading) {
    return (
      <div className="tracker-page">
        <div className="tracker-loading">
          <div className="loading-spinner large"></div>
          <p>Loading your queue status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tracker-page">
        <div className="tracker-error animate-fade-in">
          <div className="error-icon">😕</div>
          <h2>Oops!</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const isSeen = patient.status === 'seen';
  const isNext = patient.position === 1;
  const position = patient.position;
  const total = patient.total_in_queue || 0;
  const waitMin = patient.estimated_wait || 0;
  const progress = total > 0 ? ((total - position + 1) / total) * 100 : 100;

  // Status message
  let statusMsg, statusClass;
  if (isSeen) {
    statusMsg = "You've been seen! ✅";
    statusClass = 'status-seen';
  } else if (isNext) {
    statusMsg = "You're next! Get ready 🎉";
    statusClass = 'status-next';
  } else if (position === 2) {
    statusMsg = '1 patient ahead — almost there!';
    statusClass = 'status-close';
  } else if (position <= 4) {
    statusMsg = `${position - 1} patients ahead — stay nearby`;
    statusClass = 'status-close';
  } else {
    statusMsg = `${position - 1} patients ahead of you`;
    statusClass = 'status-waiting';
  }

  return (
    <div className="tracker-page">
      <div className="tracker-container animate-slide-up">
        {/* Status Banner */}
        <div className={`tracker-status ${statusClass}`}>
          <span className="status-text">{statusMsg}</span>
        </div>

        {/* Position Display */}
        {!isSeen && (
          <div className="tracker-position-area">
            <div className="position-ring">
              <svg viewBox="0 0 120 120" className="progress-ring">
                <circle
                  cx="60" cy="60" r="52"
                  className="progress-bg"
                />
                <circle
                  cx="60" cy="60" r="52"
                  className="progress-fill"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 52}`,
                    strokeDashoffset: `${2 * Math.PI * 52 * (1 - progress / 100)}`,
                  }}
                />
              </svg>
              <div className="position-content">
                <span className="position-hash">#</span>
                <span className="position-num">{position}</span>
              </div>
            </div>
            <div className="position-label">
              of {total} in queue
            </div>
          </div>
        )}

        {/* Seen State */}
        {isSeen && (
          <div className="tracker-seen-area">
            <div className="seen-icon">✅</div>
            <h2>All Done!</h2>
            <p>Thank you for your patience.</p>
          </div>
        )}

        {/* Wait Estimate */}
        {!isSeen && (
          <div className="tracker-wait glass-card-static">
            <div className="wait-header">
              <span className="wait-icon">🕐</span>
              <span className="wait-label">Estimated Wait</span>
            </div>
            <div className="wait-value">
              {isNext ? (
                <span className="wait-now">Now</span>
              ) : (
                <>
                  <span className="wait-number">~{waitMin}</span>
                  <span className="wait-unit">min</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Patient Info */}
        <div className="tracker-info glass-card-static">
          <div className="info-row">
            <span className="info-label">Patient</span>
            <span className="info-value">{patient.name}</span>
          </div>
          <div className="info-divider"></div>
          <div className="info-row">
            <span className="info-label">Appointment</span>
            <span className="info-value">{patient.appointment_label}</span>
          </div>
          <div className="info-divider"></div>
          <div className="info-row">
            <span className="info-label">Checked In</span>
            <span className="info-value">
              {new Date(patient.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {!isSeen && (
          <div className="tracker-progress">
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-labels">
              <span>Queue Start</span>
              <span>Your Turn</span>
            </div>
          </div>
        )}

        <div className="tracker-footer">
          <p>This page updates automatically • Powered by <strong>QNow</strong></p>
        </div>
      </div>
    </div>
  );
}
