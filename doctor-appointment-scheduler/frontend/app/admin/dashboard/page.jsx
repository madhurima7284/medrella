'use client';

import React, { useState, useEffect } from 'react';
import StatusBadge from '../../../components/StatusBadge';
import { fetchApi } from '../../../lib/api';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = () => {
    Promise.all([fetchApi('/admin/dashboard'), fetchApi('/admin/doctors')])
      .then(([dash, docs]) => {
        setData(dash);
        setDoctors(docs || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleApproval = async (id, status) => {
    try {
      await fetchApi(`/admin/doctors/${id}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ approvalStatus: status }),
      });
      loadAll();
    } catch (err) {
      alert(err.message || 'Failed to update approval');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading admin center...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Operations Dashboard</h1>
        <p className="text-xs text-slate-500">Review doctors, platform metrics, and system activity</p>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Patients</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{data.metrics.totalPatients}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Doctors</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{data.metrics.totalDoctors}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <span className="text-[11px] text-amber-700 uppercase font-semibold">Pending Approvals</span>
            <p className="text-2xl font-bold text-amber-900 mt-1">{data.metrics.pendingApprovals}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Appointments</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{data.metrics.totalAppointments}</p>
          </div>
        </div>
      )}

      {/* Doctor Approvals Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">
          Doctor Approval Management
        </div>
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="p-4">Doctor</th>
              <th className="p-4">Specialty</th>
              <th className="p-4">Clinic</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doctors.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-900">{d.user?.fullName}</td>
                <td className="p-4 font-medium text-teal-700">{d.specialty?.name}</td>
                <td className="p-4">{d.clinicName}</td>
                <td className="p-4">
                  <StatusBadge status={d.approvalStatus} />
                </td>
                <td className="p-4 text-right space-x-2">
                  {d.approvalStatus !== 'APPROVED' && (
                    <button
                      onClick={() => handleApproval(d.id, 'APPROVED')}
                      className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                  )}
                  {d.approvalStatus !== 'REJECTED' && (
                    <button
                      onClick={() => handleApproval(d.id, 'REJECTED')}
                      className="rounded bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Reject
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
