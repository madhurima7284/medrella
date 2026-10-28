import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  ArrowRight,
  ShieldCheck,
  Sun,
  Sunset,
} from 'lucide-react';
import { Doctor, Slot, User, Appointment } from '../types.ts';
import { clientApi } from '../api.ts';
import { formatINR, formatIndianDate, formatIndianDateTime } from '../utils/formatters.ts';

interface BookingModalProps {
  doctor: Doctor;
  currentUser: User | null;
  onClose: () => void;
  onSuccess: (appointment: Appointment) => void;
  onRequireAuth: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  doctor,
  currentUser,
  onClose,
  onSuccess,
  onRequireAuth,
}) => {
  // Generate next 10 dates for selection
  const dateOptions = Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' });
    const formattedDate = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit' });
    return { dateStr, dayName, formattedDate, isWeekend: d.getDay() === 0 };
  });

  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[1].dateStr); // Default tomorrow
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [reason, setReason] = useState('Routine medical checkup and consultation');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // Fetch slots whenever selectedDate changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingSlots(true);
    setSelectedSlot(null);
    setError(null);

    clientApi
      .getDoctorAvailability(doctor.id, selectedDate)
      .then((data: any) => {
        if (!isMounted) return;
        setSlots(data.slots || []);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setError(err.message || 'Could not fetch time slots for this date');
        setSlots([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [doctor.id, selectedDate]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    if (!selectedSlot) {
      setError('Please select an available appointment time slot');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await clientApi.bookAppointment({
        doctorId: doctor.id,
        startAt: selectedSlot.startAt,
        reasonForVisit: reason.trim(),
      });

      setConfirmedAppointment(res.appointment);
      onSuccess(res.appointment);
    } catch (err: any) {
      setError(err.message || 'Failed to complete booking. Please try another slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group slots into Morning (< 12:00) and Afternoon (>= 12:00)
  const morningSlots = slots.filter((s) => {
    const hour = new Date(s.startAt).getHours();
    return hour < 12;
  });

  const afternoonSlots = slots.filter((s) => {
    const hour = new Date(s.startAt).getHours();
    return hour >= 12;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-xl ring-1 ring-slate-900/5 my-6 text-xs">
        {/* Doctor Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div className="flex items-start gap-3.5">
            <img
              src={
                doctor.profileImageUrl ||
                'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'
              }
              alt={doctor.user?.fullName}
              className="h-12 w-12 rounded-xl object-cover border border-slate-200 shrink-0"
            />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">{doctor.user?.fullName}</h3>
                <span className="text-[11px] font-semibold text-teal-800">
                  • {doctor.specialty?.name}
                </span>
              </div>
              <p className="text-slate-500">{doctor.qualifications}</p>
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] pt-0.5">
                <MapPin className="h-3 w-3" />
                <span>{doctor.clinicName} — {doctor.clinicAddress}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {confirmedAppointment ? (
            /* Confirmation State */
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">Appointment Confirmed</h2>
                <p className="mt-0.5 text-slate-500">
                  Your appointment has been registered in the database and added to the doctor's calendar.
                </p>
              </div>

              {/* Receipt Summary */}
              <div className="mx-auto max-w-sm rounded-xl border border-slate-200 bg-slate-50 p-4 text-left space-y-2.5">
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Booking Reference</span>
                  <span className="font-mono font-semibold text-slate-900">{confirmedAppointment.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Doctor</span>
                  <span className="font-semibold text-slate-900">{doctor.user?.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Date & Time</span>
                  <span className="font-semibold text-teal-800">
                    {formatIndianDateTime(confirmedAppointment.startAt)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Clinic Location</span>
                  <span className="font-semibold text-slate-900 text-right max-w-xs">{doctor.clinicAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consultation Fee</span>
                  <span className="font-bold text-slate-900">{formatINR(doctor.consultationFee)} (Pay at clinic)</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="rounded-lg bg-teal-700 px-6 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Booking Flow */
            <form onSubmit={handleBooking} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Date Selector Tabs */}
              <div>
                <label className="block font-bold text-slate-900 mb-1.5">
                  Select Consultation Date
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5">
                  {dateOptions.map((opt) => (
                    <button
                      type="button"
                      key={opt.dateStr}
                      onClick={() => setSelectedDate(opt.dateStr)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-center transition border ${
                        selectedDate === opt.dateStr
                          ? 'border-teal-700 bg-teal-700 text-white font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-[11px] uppercase font-medium">{opt.dayName}</span>
                      <span className="block text-[10px] opacity-80">{opt.formattedDate}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Available Slots Grouped by Time */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-bold text-slate-900">
                    Available Time Slots
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {slots.filter((s) => s.available).length} slots available
                  </span>
                </div>

                {isLoadingSlots ? (
                  <div className="flex items-center justify-center py-8 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-teal-700 mr-2" />
                    Checking doctor availability...
                  </div>
                ) : slots.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-slate-500">
                    No consultation hours scheduled for this date. Please select another date.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {/* Morning Session */}
                    {morningSlots.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1.5">
                          <Sun className="h-3 w-3 text-amber-500" /> Morning
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {morningSlots.map((slot, idx) => {
                            const isSelected = selectedSlot?.startAt === slot.startAt;
                            const isUnavailable = !slot.available;
                            return (
                              <button
                                type="button"
                                key={idx}
                                disabled={isUnavailable}
                                onClick={() => setSelectedSlot(slot)}
                                className={`rounded-md py-1.5 px-1 text-center font-medium border transition ${
                                  isSelected
                                    ? 'bg-teal-700 border-teal-700 text-white font-semibold'
                                    : isUnavailable
                                    ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed line-through'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-teal-600'
                                }`}
                              >
                                {slot.time}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Afternoon Session */}
                    {afternoonSlots.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1.5">
                          <Sunset className="h-3 w-3 text-orange-500" /> Afternoon
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {afternoonSlots.map((slot, idx) => {
                            const isSelected = selectedSlot?.startAt === slot.startAt;
                            const isUnavailable = !slot.available;
                            return (
                              <button
                                type="button"
                                key={idx}
                                disabled={isUnavailable}
                                onClick={() => setSelectedSlot(slot)}
                                className={`rounded-md py-1.5 px-1 text-center font-medium border transition ${
                                  isSelected
                                    ? 'bg-teal-700 border-teal-700 text-white font-semibold'
                                    : isUnavailable
                                    ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed line-through'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-teal-600'
                                }`}
                              >
                                {slot.time}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Reason for Visit */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Reason for Visit
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Annual cardiology checkup, skin rash evaluation..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
                />
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
                <div>
                  <span className="text-[11px] text-slate-400 block">Consultation Fee</span>
                  <span className="text-sm font-bold text-slate-900">{formatINR(doctor.consultationFee)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedSlot}
                    className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-1.5 font-semibold text-white hover:bg-teal-800 disabled:opacity-50 transition"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying...
                      </>
                    ) : (
                      <>
                        <span>Confirm Booking</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
