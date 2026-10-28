import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User as UserIcon,
  Check,
  AlertCircle,
  Loader2,
  Save,
  Building2,
  Phone,
  Mail,
  ChevronDown,
} from 'lucide-react';
import { Appointment, User } from '../types.ts';
import { StatusBadge } from './StatusBadge.tsx';
import { clientApi } from '../api.ts';
import { formatIndianDate, formatIndianTime } from '../utils/formatters.ts';

interface DoctorDashboardProps {
  currentUser: User;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ currentUser }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'APPOINTMENTS' | 'SCHEDULE'>('APPOINTMENTS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'PENDING' | 'COMPLETED'>('ALL');

  // Schedule management state
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [schedules, setSchedules] = useState<
    Array<{ dayOfWeek: number; startTime: string; endTime: string; slotDurationMinutes: number; isActive: boolean }>
  >([
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isActive: true },
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isActive: true },
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isActive: true },
    { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isActive: true },
    { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, isActive: true },
  ]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  const loadAppointments = () => {
    setIsLoading(true);
    clientApi
      .getMyDoctorAppointments()
      .then((data: Appointment[]) => {
        setAppointments(data || []);
      })
      .catch((err) => console.error('Error fetching doctor appointments:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await clientApi.updateAppointmentStatus(id, newStatus);
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to update appointment status');
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSchedule(true);
    setScheduleSuccess(false);
    try {
      await clientApi.updateDoctorSchedule(schedules);
      setScheduleSuccess(true);
      setTimeout(() => setScheduleSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save schedule');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = appointments.filter((a) => a.startAt.startsWith(todayStr)).length;
  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;
  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6 text-xs">
      {/* Doctor Workspace Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:flex sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wide">
            Clinical Practice Workspace
          </span>
          <h1 className="text-xl font-bold text-slate-900">
            {currentUser.fullName}
          </h1>
          <p className="text-slate-500 text-xs">
            {currentUser.email} • Practice Schedule & Patient Consultations
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('APPOINTMENTS')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              activeTab === 'APPOINTMENTS'
                ? 'bg-teal-700 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              activeTab === 'SCHEDULE'
                ? 'bg-teal-700 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Working Hours
          </button>
        </div>
      </div>

      {/* Practice Stat Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Today's Visits</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{todayCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Confirmed</span>
          <p className="text-xl font-bold text-teal-800 mt-0.5">{confirmedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Pending Requests</span>
          <p className="text-xl font-bold text-amber-700 mt-0.5">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Patients Booked</span>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{appointments.length}</p>
        </div>
      </div>

      {activeTab === 'APPOINTMENTS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`rounded-md px-2.5 py-1 font-semibold ${
                  statusFilter === 'ALL' ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-600'
                }`}
              >
                All ({appointments.length})
              </button>
              <button
                onClick={() => setStatusFilter('CONFIRMED')}
                className={`rounded-md px-2.5 py-1 font-semibold ${
                  statusFilter === 'CONFIRMED' ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-600'
                }`}
              >
                Confirmed ({confirmedCount})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`rounded-md px-2.5 py-1 font-semibold ${
                  statusFilter === 'PENDING' ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-600'
                }`}
              >
                Pending ({pendingCount})
              </button>
            </div>

            <button onClick={loadAppointments} className="text-slate-500 hover:text-slate-800">
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-teal-700 mr-2" />
              Loading appointments...
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              No appointments in this view.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Consultation Time</th>
                      <th className="px-4 py-3">Visit Reason</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAppointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900">{apt.patient?.user?.fullName}</p>
                          <p className="text-[11px] text-slate-500">{apt.patient?.user?.email}</p>
                          <p className="text-[11px] text-slate-400">{apt.patient?.user?.phoneNumber || 'No phone'}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-900">
                            {formatIndianDate(apt.startAt)}
                          </p>
                          <p className="text-teal-800 font-medium">
                            {formatIndianTime(apt.startAt)} IST
                          </p>
                        </td>
                        <td className="px-4 py-3.5 max-w-xs">
                          <span className="text-slate-700">{apt.reasonForVisit || 'General Consultation'}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={apt.status} size="sm" />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {apt.status === 'PENDING' && (
                              <button
                                onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                                className="rounded bg-teal-50 px-2 py-1 font-semibold text-teal-800 hover:bg-teal-100"
                              >
                                Confirm
                              </button>
                            )}
                            {apt.status === 'CONFIRMED' && (
                              <button
                                onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                                className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-200"
                              >
                                Mark Completed
                              </button>
                            )}
                            {(apt.status === 'PENDING' || apt.status === 'CONFIRMED') && (
                              <button
                                onClick={() => handleUpdateStatus(apt.id, 'REJECTED')}
                                className="rounded bg-rose-50 px-2 py-1 font-semibold text-rose-700 hover:bg-rose-100"
                              >
                                Decline
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
        </div>
      )}

      {activeTab === 'SCHEDULE' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Weekly Office Hours & Availability</h2>
              <p className="text-slate-500">Configure active consulting days and appointment slot duration.</p>
            </div>
            {scheduleSuccess && (
              <span className="flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-emerald-800 font-semibold">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSchedule} className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((dayIdx) => {
              const daySchedule = schedules.find((s) => s.dayOfWeek === dayIdx) || {
                dayOfWeek: dayIdx,
                startTime: '09:00',
                endTime: '17:00',
                slotDurationMinutes: 30,
                isActive: false,
              };

              return (
                <div
                  key={dayIdx}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2.5 w-32">
                    <input
                      type="checkbox"
                      checked={daySchedule.isActive}
                      onChange={(e) => {
                        const updated = [...schedules];
                        const idx = updated.findIndex((s) => s.dayOfWeek === dayIdx);
                        if (idx >= 0) {
                          updated[idx].isActive = e.target.checked;
                        } else {
                          updated.push({
                            dayOfWeek: dayIdx,
                            startTime: '09:00',
                            endTime: '17:00',
                            slotDurationMinutes: 30,
                            isActive: e.target.checked,
                          });
                        }
                        setSchedules(updated);
                      }}
                      className="rounded text-teal-700"
                    />
                    <span className="font-bold text-slate-900">{dayNames[dayIdx]}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Hours:</span>
                    <input
                      type="time"
                      value={daySchedule.startTime}
                      disabled={!daySchedule.isActive}
                      onChange={(e) => {
                        const updated = [...schedules];
                        const item = updated.find((s) => s.dayOfWeek === dayIdx);
                        if (item) item.startTime = e.target.value;
                        setSchedules(updated);
                      }}
                      className="rounded border border-slate-200 px-2 py-1 text-slate-800 disabled:bg-slate-100"
                    />
                    <span className="text-slate-400">to</span>
                    <input
                      type="time"
                      value={daySchedule.endTime}
                      disabled={!daySchedule.isActive}
                      onChange={(e) => {
                        const updated = [...schedules];
                        const item = updated.find((s) => s.dayOfWeek === dayIdx);
                        if (item) item.endTime = e.target.value;
                        setSchedules(updated);
                      }}
                      className="rounded border border-slate-200 px-2 py-1 text-slate-800 disabled:bg-slate-100"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Duration:</span>
                    <select
                      value={daySchedule.slotDurationMinutes}
                      disabled={!daySchedule.isActive}
                      onChange={(e) => {
                        const updated = [...schedules];
                        const item = updated.find((s) => s.dayOfWeek === dayIdx);
                        if (item) item.slotDurationMinutes = Number(e.target.value);
                        setSchedules(updated);
                      }}
                      className="rounded border border-slate-200 px-2 py-1 text-slate-800 disabled:bg-slate-100"
                    >
                      <option value={15}>15 mins</option>
                      <option value={30}>30 mins</option>
                      <option value={45}>45 mins</option>
                      <option value={60}>60 mins</option>
                    </select>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingSchedule}
                className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 transition disabled:opacity-50"
              >
                {isSavingSchedule ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
