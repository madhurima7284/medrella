'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Plus } from 'lucide-react';
import StatusBadge from '../../../components/StatusBadge';
import { fetchApi } from '../../../lib/api';

export default function PatientDashboardPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAppointments = () => {
    fetchApi('/appointments/my')
      .then((data) => setAppointments(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancel = async (id) => {
    const reason = prompt('Please enter reason for cancellation:') || 'Cancelled by patient';
    try {
      await fetchApi(`/appointments/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ cancellationReason: reason }),
      });
      loadAppointments();
    } catch (err) {
      alert(err.message || 'Failed to cancel');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-xs text-slate-500">Track and manage your scheduled consultations</p>
        </div>
        <Link
          href="/doctors"
          className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" /> Book New
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500">
          No appointments found. Explore doctors to book your first visit.
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">{apt.doctor?.user?.fullName}</h3>
                  <p className="text-xs text-teal-600 font-semibold">{apt.doctor?.specialty?.name}</p>
                </div>
                <StatusBadge status={apt.status} />
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
                <div>
                  Date:{' '}
                  <strong className="text-slate-900">
                    {new Date(apt.startAt).toLocaleString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                </div>
                <div>Clinic: {apt.doctor?.clinicName} — {apt.doctor?.clinicAddress}</div>
                {apt.reasonForVisit && <div>Reason: {apt.reasonForVisit}</div>}
              </div>

              {(apt.status === 'CONFIRMED' || apt.status === 'PENDING') && (
                <div className="text-right">
                  <button
                    onClick={() => handleCancel(apt.id)}
                    className="text-xs font-medium text-rose-600 hover:underline"
                  >
                    Cancel Booking
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
