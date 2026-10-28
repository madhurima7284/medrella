import React, { useState } from 'react';
import {
  Search,
  Calendar,
  ShieldCheck,
  Clock,
  Check,
  MapPin,
  ArrowRight,
  HeartPulse,
  Sparkles,
  Stethoscope,
  Activity,
  Brain,
  Baby,
} from 'lucide-react';
import { Specialty, Doctor } from '../types.ts';
import { formatINR } from '../utils/formatters.ts';

interface HeroProps {
  specialties: Specialty[];
  featuredDoctors: Doctor[];
  selectedCity: 'Tirupati' | 'Chennai' | 'ALL';
  onSelectCity: (city: 'Tirupati' | 'Chennai' | 'ALL') => void;
  onSearch: (query: string, specialtyId?: string) => void;
  onSelectDoctor: (doctor: Doctor) => void;
  onSelectSpecialty: (specialtyId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  specialties,
  featuredDoctors,
  selectedCity,
  onSelectCity,
  onSearch,
  onSelectDoctor,
  onSelectSpecialty,
}) => {
  const [query, setQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('ALL');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, selectedSpec);
  };

  const getSpecialtyIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'cardiology':
        return <HeartPulse className="h-5 w-5 text-teal-700" />;
      case 'dermatology':
        return <Sparkles className="h-5 w-5 text-teal-700" />;
      case 'neurology':
        return <Brain className="h-5 w-5 text-teal-700" />;
      case 'pediatrics':
        return <Baby className="h-5 w-5 text-teal-700" />;
      case 'orthopedics':
        return <Activity className="h-5 w-5 text-teal-700" />;
      default:
        return <Stethoscope className="h-5 w-5 text-teal-700" />;
    }
  };

  const cityLabel =
    selectedCity === 'Tirupati'
      ? 'Tirupati (Andhra Pradesh)'
      : selectedCity === 'Chennai'
      ? 'Chennai (Tamil Nadu)'
      : 'Tirupati & Chennai';

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="border-b border-slate-200/80 bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-teal-200/80 bg-teal-50/50 px-2.5 py-1 text-xs font-semibold text-teal-900">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
              <span>Verified Medical Specialists in {cityLabel}</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Find verified doctors in{' '}
              <span className="text-teal-700">
                {selectedCity === 'Tirupati'
                  ? 'Tirupati'
                  : selectedCity === 'Chennai'
                  ? 'Chennai'
                  : 'Tirupati & Chennai'}
              </span>{' '}
              and book instantly
            </h1>

            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed sm:text-base">
              Skip hospital reception queues. Browse qualified medical specialists across Andhra Pradesh and Tamil Nadu, inspect transparent in-clinic consultation fees in Indian Rupees (₹), and book confirmed time slots in Indian Standard Time (IST).
            </p>
          </div>

          {/* Integrated Search Box (Practo / Medrella style) */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 rounded-xl border border-slate-200 bg-white p-2 shadow-sm grid gap-2 sm:grid-cols-12"
          >
            {/* Specialty / Doctor Query */}
            <div className="flex items-center gap-2 px-3 py-2 sm:col-span-5 border-b sm:border-b-0 sm:border-r border-slate-100">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Doctor name, specialty, or clinic"
                className="w-full text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            {/* City Selector in Search Bar */}
            <div className="flex items-center gap-2 px-3 py-2 sm:col-span-4 border-b sm:border-b-0 sm:border-r border-slate-100">
              <MapPin className="h-4 w-4 text-teal-700 shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => onSelectCity(e.target.value as any)}
                className="w-full text-xs sm:text-sm text-slate-800 bg-transparent font-medium focus:outline-none cursor-pointer"
              >
                <option value="Tirupati">Tirupati, Andhra Pradesh (Default)</option>
                <option value="Chennai">Chennai, Tamil Nadu</option>
                <option value="ALL">All Cities (Tirupati & Chennai)</option>
              </select>
            </div>

            {/* Specialty Select & Search Button */}
            <div className="flex items-center gap-2 sm:col-span-3">
              <select
                value={selectedSpec}
                onChange={(e) => setSelectedSpec(e.target.value)}
                className="hidden lg:block w-32 text-xs text-slate-600 bg-transparent focus:outline-none"
              >
                <option value="ALL">All Disciplines</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <button
                type="submit"
                className="w-full rounded-lg bg-teal-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-teal-800 transition shrink-0"
              >
                Find Doctors
              </button>
            </div>
          </form>

          {/* Practical Metrics Strip */}
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-4">
            <div>
              <p className="text-xl font-bold text-slate-900">100%</p>
              <p className="text-xs text-slate-500">MCI/NMC Verified Doctors</p>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">Live IST Slots</p>
              <p className="text-xs text-slate-500">Real-Time Doctor Availability</p>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">₹0 Booking Fee</p>
              <p className="text-xs text-slate-500">Transparent In-Clinic Rates</p>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">Instant</p>
              <p className="text-xs text-slate-500">Automated SMS/Email Confirmation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Specialty Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Browse by Medical Specialty
            </h2>
            <p className="text-xs text-slate-500">Select a discipline to find certified practitioners</p>
          </div>
          <button
            onClick={() => onSearch('', 'ALL')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            All Specialties <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {specialties.map((spec) => (
            <button
              type="button"
              key={spec.id}
              onClick={() => onSelectSpecialty(spec.id)}
              className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-teal-600 hover:bg-teal-50/30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 border border-slate-100">
                {getSpecialtyIcon(spec.name)}
              </div>
              <span className="font-semibold text-xs text-slate-900">{spec.name}</span>
              <span className="mt-0.5 text-[11px] text-slate-400">
                {spec.doctorCount ? `${spec.doctorCount} Doctors` : 'Specialists'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Doctors Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Available Specialists This Week
            </h2>
            <p className="text-xs text-slate-500">Doctors with verified availability for in-person consultations</p>
          </div>
          <button
            onClick={() => onSearch('')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            Browse all doctors <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredDoctors.slice(0, 3).map((doctor) => (
            <div
              key={doctor.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3.5">
                  <img
                    src={doctor.profileImageUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'}
                    alt={doctor.user?.fullName}
                    className="h-14 w-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="space-y-0.5">
                    <span className="inline-block text-[11px] font-semibold text-teal-800">
                      {doctor.specialty?.name}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">
                      {doctor.user?.fullName}
                    </h3>
                    <p className="text-[11px] text-slate-500">{doctor.qualifications}</p>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doctor.clinicName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{doctor.experienceYears} years clinical experience</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {doctor.bio}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Consultation Fee</span>
                  <p className="text-sm font-bold text-slate-900">{formatINR(doctor.consultationFee)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800">
                    {doctor.city}, {doctor.state === 'Andhra Pradesh' ? 'AP' : 'TN'}
                  </span>
                  <button
                    onClick={() => onSelectDoctor(doctor)}
                    className="rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 transition"
                  >
                    View & Book
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works (Simple, practical steps) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="max-w-xl mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              How appointment scheduling works on Medrella
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Designed for reliable, direct patient-to-doctor booking
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 text-xs">
            <div className="space-y-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-50 text-teal-800 font-bold">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Select doctor and location</h3>
              <p className="text-slate-600 leading-relaxed">
                Filter by specialty, consultation fee, or clinic address. Inspect qualifications, patient focus, and clinic affiliations.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-50 text-teal-800 font-bold">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Pick an active time slot</h3>
              <p className="text-slate-600 leading-relaxed">
                Available slots are dynamically calculated from the doctor's confirmed schedule. Double-booking is programmatically prevented.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-50 text-teal-800 font-bold">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Instant confirmation</h3>
              <p className="text-slate-600 leading-relaxed">
                Your booking is stored directly in the database. The appointment appears immediately on both your dashboard and the doctor's schedule.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
