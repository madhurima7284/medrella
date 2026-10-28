import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Building2,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge.tsx';
import { clientApi } from '../api.ts';
import { formatINR, formatIndianDateTime } from '../utils/formatters.ts';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DOCTORS' | 'PATIENTS' | 'SPECIALTIES' | 'APPOINTMENTS'>('OVERVIEW');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New specialty state
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecDesc, setNewSpecDesc] = useState('');
  const [isCreatingSpec, setIsCreatingSpec] = useState(false);

  const loadAll = () => {
    setIsLoading(true);
    Promise.all([
      clientApi.getAdminDashboard(),
      clientApi.getAdminDoctors(),
      clientApi.getAdminPatients(),
      clientApi.getSpecialties(),
      clientApi.getAdminAppointments(),
    ])
      .then(([dash, docs, pats, specs, apts]) => {
        setDashboardData(dash);
        setDoctors(docs || []);
        setPatients(pats || []);
        setSpecialties(specs || []);
        setAppointments(apts || []);
      })
      .catch((err) => console.error('Failed to load admin data:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleApproval = async (doctorId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await clientApi.updateDoctorApproval(doctorId, status);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to update doctor approval status');
    }
  };

  const handleToggleUser = async (userId: string) => {
    try {
      await clientApi.toggleUserActive(userId);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleCreateSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecName.trim()) return;

    setIsCreatingSpec(true);
    try {
      await clientApi.createSpecialty({
        name: newSpecName.trim(),
        description: newSpecDesc.trim(),
      });
      setNewSpecName('');
      setNewSpecDesc('');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to create specialty');
    } finally {
      setIsCreatingSpec(false);
    }
  };

  const handleDeleteSpecialty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this specialty?')) return;
    try {
      await clientApi.deleteSpecialty(id);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to delete specialty');
    }
  };

  const handleResetDb = async () => {
    if (!confirm('Reset database back to initial seed data?')) return;
    try {
      await clientApi.resetDatabase();
      loadAll();
    } catch (err: any) {
      alert('Reset failed');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6 text-xs">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:flex sm:items-center sm:justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Administration
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">Platform Operations Center</h1>
          <p className="text-slate-500 text-xs">
            Review doctor credentials, platform booking volume, and medical specialties
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <button
            onClick={handleResetDb}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Demo DB
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`rounded-lg px-3 py-1.5 font-semibold transition ${
            activeTab === 'OVERVIEW'
              ? 'bg-slate-900 text-white font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Overview & Metrics
        </button>
        <button
          onClick={() => setActiveTab('DOCTORS')}
          className={`rounded-lg px-3 py-1.5 font-semibold transition ${
            activeTab === 'DOCTORS'
              ? 'bg-slate-900 text-white font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Doctor Approvals ({doctors.filter((d) => d.approvalStatus === 'PENDING').length} Pending)
        </button>
        <button
          onClick={() => setActiveTab('SPECIALTIES')}
          className={`rounded-lg px-3 py-1.5 font-semibold transition ${
            activeTab === 'SPECIALTIES'
              ? 'bg-slate-900 text-white font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Specialties ({specialties.length})
        </button>
        <button
          onClick={() => setActiveTab('PATIENTS')}
          className={`rounded-lg px-3 py-1.5 font-semibold transition ${
            activeTab === 'PATIENTS'
              ? 'bg-slate-900 text-white font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Patients ({patients.length})
        </button>
        <button
          onClick={() => setActiveTab('APPOINTMENTS')}
          className={`rounded-lg px-3 py-1.5 font-semibold transition ${
            activeTab === 'APPOINTMENTS'
              ? 'bg-slate-900 text-white font-bold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Appointments ({appointments.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-slate-700 mr-2" />
          Loading platform records...
        </div>
      ) : (
        <>
          {activeTab === 'OVERVIEW' && dashboardData && (
            <div className="space-y-6">
              {/* Stat Strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Registered Patients
                  </span>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {dashboardData.metrics.totalPatients}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Total Doctors
                  </span>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {dashboardData.metrics.totalDoctors}
                  </p>
                  <span className="text-teal-800 font-medium">
                    {dashboardData.metrics.approvedDoctors} Approved
                  </span>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <span className="text-[11px] font-semibold text-amber-800 uppercase">
                    Pending Verification
                  </span>
                  <p className="mt-1 text-2xl font-bold text-amber-900">
                    {dashboardData.metrics.pendingApprovals}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Total Bookings
                  </span>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {dashboardData.metrics.totalAppointments}
                  </p>
                  <span className="text-slate-600 font-medium">
                    {formatINR(dashboardData.metrics.totalRevenue)} Volume
                  </span>
                </div>
              </div>

              {/* Status Breakdown & Recent Appointments */}
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                  <h3 className="font-bold text-slate-900">Booking Status Breakdown</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-600">Confirmed</span>
                      <span className="font-bold text-emerald-700">
                        {dashboardData.metrics.statusCounts.CONFIRMED}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-600">Completed</span>
                      <span className="font-bold text-blue-700">
                        {dashboardData.metrics.statusCounts.COMPLETED}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-600">Pending</span>
                      <span className="font-bold text-amber-700">
                        {dashboardData.metrics.statusCounts.PENDING}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Cancelled</span>
                      <span className="font-bold text-slate-500">
                        {dashboardData.metrics.statusCounts.CANCELLED}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                  <h3 className="font-bold text-slate-900">Recent Appointments Feed</h3>
                  <div className="divide-y divide-slate-100">
                    {dashboardData.recentAppointments?.map((apt: any) => (
                      <div key={apt.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {apt.patientName} → {apt.doctorName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatIndianDateTime(apt.startAt)} • {apt.reasonForVisit}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900">{formatINR(apt.fee)}</span>
                          <StatusBadge status={apt.status} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'DOCTORS' && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="p-4 border-b border-slate-100 font-bold text-slate-900">
                Doctor Verification & Approvals
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Doctor</th>
                      <th className="px-4 py-3">Specialty</th>
                      <th className="px-4 py-3">Qualifications & Clinic</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {doctors.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{doc.user?.fullName}</p>
                          <p className="text-[11px] text-slate-400">{doc.user?.email}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-teal-800">
                          {doc.specialty?.name}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-900">{doc.qualifications}</p>
                          <p className="text-slate-500 text-[11px]">
                            {doc.clinicName} • <span className="font-semibold text-teal-800">{doc.city || 'Tirupati'}, {doc.state === 'Tamil Nadu' ? 'TN' : 'AP'}</span>
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={doc.approvalStatus} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {doc.approvalStatus !== 'APPROVED' && (
                              <button
                                onClick={() => handleApproval(doc.id, 'APPROVED')}
                                className="rounded bg-teal-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-800 transition"
                              >
                                Approve
                              </button>
                            )}
                            {doc.approvalStatus !== 'REJECTED' && (
                              <button
                                onClick={() => handleApproval(doc.id, 'REJECTED')}
                                className="rounded bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'SPECIALTIES' && (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                <h3 className="font-bold text-slate-900">Add Medical Specialty</h3>
                <form onSubmit={handleCreateSpecialty} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Specialty Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newSpecName}
                      onChange={(e) => setNewSpecName(e.target.value)}
                      placeholder="e.g. Ophthalmology, Oncology"
                      className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:outline-none focus:border-teal-700"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={newSpecDesc}
                      onChange={(e) => setNewSpecDesc(e.target.value)}
                      placeholder="Overview of medical services covered..."
                      className="w-full rounded-lg border border-slate-200 p-2 text-slate-900 focus:outline-none focus:border-teal-700"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isCreatingSpec}
                    className="w-full rounded-lg bg-teal-700 py-2 font-semibold text-white hover:bg-teal-800 transition disabled:opacity-50"
                  >
                    {isCreatingSpec ? 'Adding...' : 'Add Specialty'}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="p-4 border-b border-slate-100 font-bold text-slate-900">
                  Active Clinical Specialties
                </div>
                <div className="divide-y divide-slate-100">
                  {specialties.map((spec) => (
                    <div key={spec.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                      <div>
                        <p className="font-bold text-slate-900">{spec.name}</p>
                        <p className="text-slate-500 text-[11px]">{spec.description}</p>
                        <span className="text-[10px] text-teal-800 font-medium">
                          {spec.doctorCount || 0} Assigned Doctors
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteSpecialty(spec.id)}
                        className="rounded p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete specialty"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'PATIENTS' && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="p-4 border-b border-slate-100 font-bold text-slate-900">
                Registered Patients
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Email & Phone</th>
                      <th className="px-4 py-3">Bookings</th>
                      <th className="px-4 py-3">Account Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patients.map((pat) => (
                      <tr key={pat.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {pat.user?.fullName}
                        </td>
                        <td className="px-4 py-3">
                          <p>{pat.user?.email}</p>
                          <p className="text-[11px] text-slate-400">{pat.user?.phoneNumber || 'No phone'}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-teal-800">
                          {pat.appointmentCount || 0} visits
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              pat.user?.isActive
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-rose-50 text-rose-800'
                            }`}
                          >
                            {pat.user?.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleToggleUser(pat.user?.id)}
                            className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
                          >
                            {pat.user?.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'APPOINTMENTS' && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="p-4 border-b border-slate-100 font-bold text-slate-900">
                All Platform Appointments
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Doctor</th>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {apt.patient?.user?.fullName}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {apt.doctor?.user?.fullName} ({apt.doctor?.specialty?.name})
                        </td>
                        <td className="px-4 py-3">
                          {formatIndianDateTime(apt.startAt)}
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate">
                          {apt.reasonForVisit || 'General Consultation'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={apt.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
