import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  X,
  AlertCircle,
  Loader2,
  Plus,
  Building2,
  FileText,
} from 'lucide-react';
import { Appointment, User } from '../types.ts';
import { StatusBadge } from './StatusBadge.tsx';
import { clientApi } from '../api.ts';
import { formatINR, formatIndianDateTime } from '../utils/formatters.ts';

interface PatientDashboardProps {
  currentUser: User;
  onBookNew: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  currentUser,
  onBookNew,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [filterTab, setFilterTab] = useState<'UPCOMING' | 'PAST' | 'ALL'>('UPCOMING');

  const loadAppointments = () => {
    setIsLoading(true);
    clientApi
      .getMyPatientAppointments()
      .then((data: Appointment[]) => {
        // Defensive check: ensure all loaded appointments belong strictly to current authenticated patient
        const verified = (data || []).filter((apt) => {
          if (apt.patient?.userId && apt.patient.userId !== currentUser.id) {
            return false;
          }
          return true;
        });
        setAppointments(verified);
      })
      .catch((err) => console.error('Failed to load appointments:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAppointments();
  }, [currentUser.id]);

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingId) return;

    setIsSubmittingCancel(true);
    try {
      await clientApi.cancelAppointment(cancellingId, cancelReason || 'Cancelled by patient');
      setCancellingId(null);
      setCancelReason('');
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const nowMs = Date.now();

  // 1. Upcoming: Only the logged-in patient's future appointments that are still booked/confirmed/pending
  const upcoming = appointments
    .filter((a) => {
      const startMs = new Date(a.startAt).getTime();
      return startMs >= nowMs && (a.status === 'CONFIRMED' || a.status === 'PENDING');
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  // 2. Past & Cancelled: Only that patient's genuinely past or cancelled/completed/rejected appointments
  const past = appointments
    .filter((a) => {
      const startMs = new Date(a.startAt).getTime();
      return startMs < nowMs || a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'REJECTED';
    })
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

  // 3. All History: Only that patient's real appointments, sorted newest first
  const allHistory = [...appointments].sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
  );

  const displayedAppointments =
    filterTab === 'UPCOMING' ? upcoming : filterTab === 'PAST' ? past : allHistory;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6 text-xs">
      {/* Patient Portal Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:flex sm:items-center sm:justify-between">
        <div>
          <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wide">
            Patient Portal
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            {currentUser.fullName}
          </h1>
          <p className="text-slate-500 text-xs">
            {currentUser.email} • {currentUser.phoneNumber || 'Contact number on file'}
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <button
            onClick={onBookNew}
            className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition"
          >
            <Plus className="h-3.5 w-3.5" /> Book Consultation
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTab('UPCOMING')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              filterTab === 'UPCOMING'
                ? 'bg-teal-50 text-teal-800 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Upcoming ({upcoming.length})
          </button>
          <button
            onClick={() => setFilterTab('PAST')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              filterTab === 'PAST'
                ? 'bg-teal-50 text-teal-800 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Past & Cancelled ({past.length})
          </button>
          <button
            onClick={() => setFilterTab('ALL')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              filterTab === 'ALL'
                ? 'bg-teal-50 text-teal-800 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All History ({allHistory.length})
          </button>
        </div>

        <button
          onClick={loadAppointments}
          className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
        >
          Refresh
        </button>
      </div>

      {/* Appointment Listings */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-teal-700 mr-2" />
          Loading your appointments...
        </div>
      ) : displayedAppointments.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 space-y-2">
          <Calendar className="mx-auto h-8 w-8 text-slate-300" />
          <p className="font-semibold text-slate-700">No appointments in this view</p>
          <p className="text-slate-400">Schedule a visit with any doctor from our directory.</p>
          <button
            onClick={onBookNew}
            className="mt-2 rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
          >
            Find a Doctor
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedAppointments.map((apt) => (
            <div
              key={apt.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:flex sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={
                    apt.doctor?.profileImageUrl ||
                    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'
                  }
                  alt={apt.doctor?.user?.fullName}
                  className="h-12 w-12 rounded-lg object-cover border border-slate-200 shrink-0"
                />

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{apt.doctor?.user?.fullName}</span>
                    <span className="text-teal-800 font-semibold">• {apt.doctor?.specialty?.name}</span>
                    <StatusBadge status={apt.status} size="sm" />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-slate-600">
                    <span className="font-semibold text-slate-900">
                      {formatIndianDateTime(apt.startAt)}
                    </span>
                    <span>•</span>
                    <span>{apt.doctor?.clinicName} ({apt.doctor?.city}, {apt.doctor?.state === 'Andhra Pradesh' ? 'AP' : 'TN'})</span>
                  </div>

                  {apt.reasonForVisit && (
                    <p className="text-slate-500 pt-0.5">
                      <span className="font-medium text-slate-700">Reason: </span>
                      {apt.reasonForVisit}
                    </p>
                  )}

                  {apt.cancellationReason && (
                    <p className="text-rose-600 font-medium">
                      Cancelled: {apt.cancellationReason}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 shrink-0">
                <span className="font-bold text-slate-900">
                  Fee: {formatINR(apt.doctor?.consultationFee || 0)}
                </span>

                {(apt.status === 'CONFIRMED' || apt.status === 'PENDING') && (
                  <button
                    onClick={() => {
                      setCancellingId(apt.id);
                      setCancelReason('');
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Confirmation Dialog */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Cancel Appointment?</h3>
            <p className="text-slate-500">
              This appointment slot will be released back to the doctor's available calendar.
            </p>

            <form onSubmit={handleCancel} className="space-y-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for cancellation
                </label>
                <input
                  type="text"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Rescheduled travel, feeling better..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCancellingId(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancel}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {isSubmittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
