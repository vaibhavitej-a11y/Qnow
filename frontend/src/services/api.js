/**
 * QNow API Service — REST + Socket.IO client
 */
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';
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

export async function addPatient(name, appointmentType, phone = '') {
  return request('/patients', {
    method: 'POST',
    body: JSON.stringify({ name, appointment_type: appointmentType, phone }),
  });
}

export async function getPatient(patientId) {
  return request(`/patients/${patientId}`);
}

export async function getAllPatients() {
  return request('/patients');
}

export async function getAppointmentTypes() {
  return request('/appointment-types');
}

// ── Queue API ────────────────────────────────────────────────

export async function getQueue() {
  return request('/queue');
}

export async function markNextPatient() {
  return request('/queue/next', { method: 'POST' });
}

export async function markPatientSeen(patientId) {
  return request(`/queue/mark/${patientId}`, { method: 'POST' });
}

export async function removePatient(patientId) {
  return request(`/queue/${patientId}`, { method: 'DELETE' });
}

// ── Stats API ────────────────────────────────────────────────

export async function getStats() {
  return request('/stats');
}

// ── WebSocket ────────────────────────────────────────────────

export function connectSocket(onQueueUpdate) {
  if (socket) return socket;

  socket = io('http://localhost:5000', {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[WS] Connected');
  });

  socket.on('disconnect', () => {
    console.log('[WS] Disconnected');
  });

  socket.on('queue_updated', (data) => {
    if (onQueueUpdate) onQueueUpdate(data);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinPatientRoom(patientId) {
  if (socket) {
    socket.emit('join_patient', { patient_id: patientId });
  }
}
