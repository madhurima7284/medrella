'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, DollarSign, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '../../../lib/api';

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.id;

  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('Routine medical consultation');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);

  useEffect(() => {
    fetchApi(`/doctors/${doctorId}`)
      .then((d) => setDoctor(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId) return;
    fetchApi(`/doctors/${doctorId}/availability?date=${selectedDate}`)
      .then((res) => setSlots(res?.slots || []))
      .catch(() => setSlots([]));
  }, [doctorId, selectedDate]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return alert('Please select a time slot');

    setSubmitting(true);
    try {
      const res = await fetchApi('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctorId,
          startAt: selectedSlot.startAt,
          reasonForVisit: reason,
        }),
      });
      setBookingConfirmed(res.appointment);
    } catch (err) {
      alert(err.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading doctor details...</div>;
  }

  if (!doctor) {
    return <div className="p-12 text-center text-xs text-slate-500">Doctor not found.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      {/* Profile Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-start gap-5">
        <img
          src={doctor.profileImageUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'}
          alt={doctor.user?.fullName}
          className="h-24 w-24 rounded-2xl object-cover border border-slate-200"
        />
        <div className="space-y-1.5">
          <span className="rounded bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700">
            {doctor.specialty?.name}
          </span>
          <h1 className="text-2xl font-bold text-slate-900">{doctor.user?.fullName}</h1>
          <p className="text-xs text-slate-500">{doctor.qualifications}</p>
          <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
            <span>{doctor.clinicName} — {doctor.clinicAddress}</span>
            <span>Fee: ${doctor.consultationFee}</span>
          </div>
          <p className="text-xs text-slate-600 pt-2 leading-relaxed">{doctor.bio}</p>
        </div>
      </div>

      {bookingConfirmed ? (
        <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-8 text-center space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h2 className="text-xl font-bold text-slate-900">Appointment Confirmed!</h2>
          <p className="text-xs text-slate-600">
            Your appointment has been registered with {doctor.user?.fullName}.
          </p>
          <Link
            href="/patient/dashboard"
            className="inline-block rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-teal-700"
          >
            Go to My Appointments
          </Link>
        </div>
      ) : (
        <form onSubmit={handleBook} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900">Select Date & Available Time Slot</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-200 p-2 text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Available Slots</label>
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s, idx) => (
                <button
                  type="button"
                  key={idx}
                  disabled={!s.available}
                  onClick={() => setSelectedSlot(s)}
                  className={`rounded-xl py-2 px-1 text-xs font-semibold border ${
                    selectedSlot?.startAt === s.startAt
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : !s.available
                      ? 'bg-slate-50 border-slate-200 text-slate-300 line-through'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-teal-500'
                  }`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Visit</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedSlot}
            className="w-full rounded-xl bg-teal-600 py-3 text-xs font-bold text-white shadow-md hover:bg-teal-700 disabled:opacity-50"
          >
            {submitting ? 'Confirming...' : 'Book Appointment'}
          </button>
        </form>
      )}
    </div>
  );
}
