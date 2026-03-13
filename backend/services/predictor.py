"""
AI Wait-Time Prediction Engine for QNow.

Uses a weighted-average model considering:
  - Appointment type (checkup ~8min, consultation ~15min, procedure ~25min)
  - Queue depth ahead of the patient
  - Time-of-day factor (busier hours = longer waits)
"""

from datetime import datetime
from models.store import APPOINTMENT_TYPES, queue, patients

# ── Time-of-day multipliers ───────────────────────────────────────
# Mornings are fastest, late morning/afternoon peak, evenings taper
TIME_FACTORS = {
    range(6, 9):   0.85,   # Early morning — light traffic
    range(9, 12):  1.15,   # Late morning — peak
    range(12, 14): 1.00,   # Lunch lull
    range(14, 17): 1.20,   # Afternoon — peak
    range(17, 20): 0.95,   # Evening — winding down
    range(20, 24): 0.80,   # Night — minimal
    range(0, 6):   0.70,   # Late night / early AM
}


def _get_time_factor():
    """Get the time-of-day multiplier for the current hour."""
    hour = datetime.now().hour
    for hour_range, factor in TIME_FACTORS.items():
        if hour in hour_range:
            return factor
    return 1.0


def _get_base_minutes(appointment_type):
    """Get base duration for an appointment type."""
    return APPOINTMENT_TYPES.get(appointment_type, APPOINTMENT_TYPES["checkup"])["base_minutes"]


def predict_wait_for_patient(patient_id):
    """
    Predict wait time in minutes for a specific patient.
    Sums up estimated durations of all patients ahead in the queue.
    """
    if patient_id not in queue:
        return 0

    position = queue.index(patient_id)
    if position == 0:
        return 0  # You're next!

    time_factor = _get_time_factor()
    total_wait = 0.0

    # Sum estimated consultation time for everyone ahead
    for i in range(position):
        ahead_id = queue[i]
        ahead_patient = patients.get(ahead_id, {})
        base = _get_base_minutes(ahead_patient.get("appointment_type", "checkup"))
        total_wait += base * time_factor

    # Add small queue-depth overhead (congestion factor)
    congestion = 1.0 + (position * 0.02)  # 2% extra per person ahead
    total_wait *= congestion

    return round(total_wait)


def predict_all_waits():
    """Return a dict of {patient_id: estimated_minutes} for the whole queue."""
    result = {}
    time_factor = _get_time_factor()

    cumulative = 0.0
    for i, pid in enumerate(queue):
        if i == 0:
            result[pid] = 0
            base = _get_base_minutes(patients.get(pid, {}).get("appointment_type", "checkup"))
            cumulative += base * time_factor
        else:
            congestion = 1.0 + (i * 0.02)
            result[pid] = round(cumulative * congestion)
            base = _get_base_minutes(patients.get(pid, {}).get("appointment_type", "checkup"))
            cumulative += base * time_factor

    return result


def get_average_wait():
    """Get current average predicted wait across all waiting patients."""
    waits = predict_all_waits()
    if not waits:
        return 0
    return round(sum(waits.values()) / len(waits))
