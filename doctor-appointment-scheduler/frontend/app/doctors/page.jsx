'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, MapPin, Clock, ChevronRight } from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function DoctorDirectoryPage() {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [city, setCity] = useState('Tirupati');
  const [search, setSearch] = useState('');
  const [specialtyId, setSpecialtyId] = useState('ALL');

  useEffect(() => {
    fetchApi('/specialties').then((d) => setSpecialties(d || []));
    fetchApi(`/doctors${city !== 'ALL' ? `?city=${city}` : ''}`).then((d) => setDoctors(d || []));
  }, [city]);

  const filtered = doctors.filter((doc) => {
    if (city !== 'ALL' && doc.city && doc.city.toLowerCase() !== city.toLowerCase()) return false;
    if (specialtyId !== 'ALL' && doc.specialtyId !== specialtyId) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        doc.user?.fullName.toLowerCase().includes(q) ||
        doc.clinicName.toLowerCase().includes(q) ||
        doc.specialty?.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Doctor Directory</h1>
          <p className="text-xs text-slate-500">Find approved doctors in Tirupati (AP) & Chennai (TN) with live IST slots</p>
        </div>

        {/* City Toggle */}
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-xs">
          <button
            onClick={() => setCity('Tirupati')}
            className={`rounded-lg px-3 py-1 font-semibold transition ${city === 'Tirupati' ? 'bg-teal-700 text-white' : 'text-slate-600'}`}
          >
            Tirupati, AP
          </button>
          <button
            onClick={() => setCity('Chennai')}
            className={`rounded-lg px-3 py-1 font-semibold transition ${city === 'Chennai' ? 'bg-teal-700 text-white' : 'text-slate-600'}`}
          >
            Chennai, TN
          </button>
          <button
            onClick={() => setCity('ALL')}
            className={`rounded-lg px-3 py-1 font-semibold transition ${city === 'ALL' ? 'bg-teal-700 text-white' : 'text-slate-600'}`}
          >
            All Cities
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctor, clinic or symptoms..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <select
          value={specialtyId}
          onChange={(e) => setSpecialtyId(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 bg-white"
        >
          <option value="ALL">All Disciplines</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-4">
              <img
                src={doc.profileImageUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'}
                alt={doc.user?.fullName}
                className="h-16 w-16 rounded-2xl object-cover border border-slate-200 shrink-0"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700">
                    {doc.specialty?.name}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {doc.city || 'Tirupati'}, {doc.state === 'Tamil Nadu' ? 'TN' : 'AP'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{doc.user?.fullName}</h3>
                <p className="text-xs text-slate-500">{doc.qualifications}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                  <span>{doc.clinicName}</span>
                  <span>•</span>
                  <span>{doc.experienceYears} Years Exp</span>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
              <div className="sm:text-right">
                <span className="text-[10px] text-slate-400 uppercase">Consultation</span>
                <p className="text-base font-bold text-slate-900">₹{doc.consultationFee}</p>
              </div>

              <Link
                href={`/doctors/${doc.id}`}
                className="flex items-center gap-1 rounded-xl bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
              >
                <span>View Slots & Book</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
