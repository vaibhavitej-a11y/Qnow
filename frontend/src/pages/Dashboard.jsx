import { useState, useEffect, useCallback } from 'react';
import StatsBar from '../components/StatsBar';
import QueueCard from '../components/QueueCard';
import AddPatientModal from '../components/AddPatientModal';
import {
  getQueue, getStats, addPatient, markPatientSeen,
  markNextPatient, removePatient, connectSocket
} from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copyId, setCopyId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [q, s] = await Promise.all([getQueue(), getStats()]);
      setQueue(q);
      setStats(s);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // WebSocket for real-time updates
    const socket = connectSocket((data) => {
      if (data.queue) setQueue(data.queue);
      if (data.stats) setStats(data.stats);
    });

    // Fallback polling every 5s
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAddPatient = async (name, type) => {
    await addPatient(name, type);
    await fetchData();
  };

  const handleMarkSeen = async (id) => {
    await markPatientSeen(id);
    await fetchData();
  };

  const handleRemove = async (id) => {
    await removePatient(id);
    await fetchData();
  };

  const handleNextPatient = async () => {
    await markNextPatient();
    await fetchData();
  };

  const copyPatientLink = (id) => {
    const link = `${window.location.origin}/patient/${id}`;
    navigator.clipboard.writeText(link);
    setCopyId(id);
    setTimeout(() => setCopyId(null), 2000);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-top">
        <div className="dashboard-title-area">
          <h2 className="dashboard-title">
            <span className="gradient-text">Live Queue</span>
          </h2>
          <p className="dashboard-desc">Manage patients and monitor queue in real-time</p>
        </div>
        <div className="dashboard-actions">
          {queue.length > 0 && (
            <button className="btn-secondary" onClick={handleNextPatient}>
              ⏭ Next Patient
            </button>
          )}
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            + Add Patient
          </button>
        </div>
      </div>

      <StatsBar stats={stats} />

      {loading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading queue...</p>
        </div>
      ) : queue.length === 0 ? (
        <div className="dashboard-empty">
          <div className="empty-icon">🏥</div>
          <h3>No patients in queue</h3>
          <p>Add a patient to get started</p>
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            + Add First Patient
          </button>
        </div>
      ) : (
        <div className="queue-list">
          <div className="queue-list-header">
            <span className="queue-count">{queue.length} patient{queue.length !== 1 ? 's' : ''} waiting</span>
          </div>
          {queue.map((patient) => (
            <div key={patient.id} className="queue-item-wrapper">
              <QueueCard
                patient={patient}
                onMarkSeen={handleMarkSeen}
                onRemove={handleRemove}
              />
              <button
                className="copy-link-btn"
                onClick={() => copyPatientLink(patient.id)}
                title="Copy patient tracking link"
              >
                {copyId === patient.id ? '✓ Copied!' : '🔗 Copy Link'}
              </button>
            </div>
          ))}
        </div>
      )}

      <AddPatientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddPatient}
      />
    </div>
  );
}
