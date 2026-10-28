'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Sparkles, CheckCircle2, Clock, Shield, ArrowRight, MapPin } from 'lucide-react';
import { fetchApi } from '../lib/api';

export default function HomePage() {
  const [specialties, setSpecialties] = useState([]);
  const [featuredDoctors, setFeaturedDoctors] = useState([]);

  useEffect(() => {
    fetchApi('/specialties')
      .then((data) => setSpecialties(data || []))
      .catch(() => {});

    fetchApi('/doctors')
      .then((data) => setFeaturedDoctors(data || []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-50/70 via-white to-white pt-12 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              Verified Healthcare Providers & Real-Time Availability
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
              Book Top-Rated Doctors <br />
              <span className="text-teal-600">In Minutes, Not Weeks</span>
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed">
              Find board-certified specialists, browse transparent consultation fees, and reserve your appointment slot in real-time.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/doctors"
                className="rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-teal-600/30 hover:bg-teal-700"
              >
                Find & Book Doctors
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Explore by Specialty
            </h2>
            <p className="text-xs text-slate-500">Board-certified specialists across clinical fields</p>
          </div>
          <Link href="/doctors" className="text-xs font-semibold text-teal-600 flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {specialties.slice(0, 5).map((spec) => (
            <Link
              key={spec.id}
              href={`/doctors?specialtyId=${spec.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-center transition hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="text-sm font-bold text-slate-900">{spec.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{spec.doctorCount || 0} Specialists</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
