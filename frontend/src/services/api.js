/**
 * QNow 2.0 API Service — REST + Socket.IO client
 */
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE = `${BACKEND_URL}/api`;
let socket = null;


// ── REST API Helpers ─────────────────────────────────────────

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Patient API ──────────────────────────────────────────────

export const patientApi = {
  add: async (data) => {
    return request('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getDetails: async (patientId) => {
    return request(`/patients/${patientId}`);
  },
  getAll: async () => {
    return request('/patients');
  },
  getAppointmentTypes: async () => {
    return request('/appointment-types');
  },
  analyzeTriage: async (symptoms, age, isEmergency) => {
    return request('/triage/analyze', {
      method: "POST",
      body: JSON.stringify({ symptoms, age, is_emergency: isEmergency }),
    });
  }
};

// ── Queue API ────────────────────────────────────────────────

export const queueApi = {
  getQueue: async () => {
    return request('/queue');
  },
  markNext: async () => {
    return request('/queue/next', { method: 'POST' });
  },
  markSeen: async (patientId) => {
    return request(`/queue/mark-seen/${patientId}`, { method: 'POST' });
  },
  markDeceased: async (patientId) => {
    return request(`/queue/mark-deceased/${patientId}`, { method: 'POST' });
  },
  remove: async (patientId) => {
    return request(`/queue/${patientId}`, { method: 'DELETE' });
  }
};

// ── Stats & Meta API ─────────────────────────────────────────

export const metaApi = {
  getStats: async () => {
    return request('/queue/stats');
  },
  getDoctors: async () => {
    return request('/doctors');
  },
  getHospitals: async () => {
    return request('/hospitals');
  }
};

// ── WebSocket ────────────────────────────────────────────────

export function connectSocket(callbacks) {
  if (socket) return socket;

  socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => console.log('[WS] Connected'));

  if (callbacks) {
    if (callbacks.onQueue) socket.on('queue_updated', callbacks.onQueue);
    if (callbacks.onMeta) socket.on('meta_updated', callbacks.onMeta);
    if (callbacks.onDoctors) socket.on('doctors_updated', callbacks.onDoctors);
    if (callbacks.onHospitals) socket.on('hospitals_updated', callbacks.onHospitals);
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
