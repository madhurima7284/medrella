'use client';

import React, { useState, useEffect } from 'react';
import StatusBadge from '../../../components/StatusBadge';
import { fetchApi } from '../../../lib/api';

export default function DoctorDashboardPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAppointments = () => {
    fetchApi('/appointments/doctor')
      .then((data) => setAppointments(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleUpdate = async (id, status) => {
    try {
      await fetchApi(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      loadAppointments();
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Doctor Practice Dashboard</h1>
        <p className="text-xs text-slate-500">Manage incoming consultations and patient appointments</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading appointments...</div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-4">Patient</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">{a.patient?.user?.fullName}</td>
                  <td className="p-4">
                    {new Date(a.startAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="p-4 max-w-xs truncate">{a.reasonForVisit}</td>
                  <td className="p-4">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {a.status === 'PENDING' && (
                      <button
                        onClick={() => handleUpdate(a.id, 'CONFIRMED')}
                        className="rounded bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100"
                      >
                        Confirm
                      </button>
                    )}
                    {a.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdate(a.id, 'COMPLETED')}
                        className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
