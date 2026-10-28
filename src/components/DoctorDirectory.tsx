import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Clock,
  ShieldCheck,
  Calendar,
  Building2,
  ChevronRight,
  Filter,
  Phone,
} from 'lucide-react';
import { Doctor, Specialty } from '../types.ts';
import { formatINR } from '../utils/formatters.ts';

interface DoctorDirectoryProps {
  doctors: Doctor[];
  specialties: Specialty[];
  selectedCity: 'Tirupati' | 'Chennai' | 'ALL';
  onCityChange: (city: 'Tirupati' | 'Chennai' | 'ALL') => void;
  selectedSpecialtyId: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSpecialtyChange: (id: string) => void;
  onSelectDoctor: (doc: Doctor) => void;
}

export const DoctorDirectory: React.FC<DoctorDirectoryProps> = ({
  doctors,
  specialties,
  selectedCity,
  onCityChange,
  selectedSpecialtyId,
  searchQuery,
  onSearchChange,
  onSpecialtyChange,
  onSelectDoctor,
}) => {
  const [maxFeeFilter, setMaxFeeFilter] = useState<number>(1500);
  const [experienceFilter, setExperienceFilter] = useState<number>(0);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      // City filter
      if (selectedCity !== 'ALL' && doc.city && doc.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      // Specialty filter
      if (selectedSpecialtyId !== 'ALL' && doc.specialtyId !== selectedSpecialtyId) {
        return false;
      }
      // Fee filter
      if (doc.consultationFee > maxFeeFilter) {
        return false;
      }
      // Experience filter
      if (doc.experienceYears < experienceFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = doc.user?.fullName.toLowerCase().includes(q);
        const specMatch = doc.specialty?.name.toLowerCase().includes(q);
        const clinicMatch = doc.clinicName.toLowerCase().includes(q);
        const qualMatch = doc.qualifications.toLowerCase().includes(q);
        const cityMatch = doc.city?.toLowerCase().includes(q);
        return nameMatch || specMatch || clinicMatch || qualMatch || cityMatch;
      }
      return true;
    });
  }, [doctors, selectedCity, selectedSpecialtyId, maxFeeFilter, experienceFilter, searchQuery]);

  const cityNameHeader =
    selectedCity === 'Tirupati'
      ? 'Tirupati, Andhra Pradesh (Default)'
      : selectedCity === 'Chennai'
      ? 'Chennai, Tamil Nadu'
      : 'Tirupati & Chennai, India';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Directory Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Doctor Directory
            </h1>
            <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
              {cityNameHeader}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Book in-person appointments with verified doctors in Tirupati, AP & Chennai, TN
          </p>
        </div>

        {/* City Toggle Buttons */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs shadow-2xs self-start sm:self-auto">
          <button
            onClick={() => onCityChange('Tirupati')}
            className={`rounded-md px-3 py-1 font-semibold transition ${
              selectedCity === 'Tirupati'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tirupati, AP
          </button>
          <button
            onClick={() => onCityChange('Chennai')}
            className={`rounded-md px-3 py-1 font-semibold transition ${
              selectedCity === 'Chennai'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chennai, TN
          </button>
          <button
            onClick={() => onCityChange('ALL')}
            className={`rounded-md px-3 py-1 font-semibold transition ${
              selectedCity === 'ALL'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Cities
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Filter Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-teal-700" /> Filters
              </span>
              <button
                onClick={() => {
                  onSearchChange('');
                  onSpecialtyChange('ALL');
                  onCityChange('Tirupati');
                  setMaxFeeFilter(1500);
                  setExperienceFilter(0);
                }}
                className="text-[11px] text-teal-700 hover:underline"
              >
                Reset to Default
              </button>
            </div>

            {/* City Selection */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                City / Location
              </label>
              <select
                value={selectedCity}
                onChange={(e) => onCityChange(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 bg-white focus:border-teal-600 focus:outline-none"
              >
                <option value="Tirupati">Tirupati, Andhra Pradesh (Default)</option>
                <option value="Chennai">Chennai, Tamil Nadu</option>
                <option value="ALL">All Practice Locations</option>
              </select>
            </div>

            {/* Keyword Search */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Search Doctor or Clinic
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Doctor, hospital, or qualification..."
                  className="w-full rounded-lg border border-slate-200 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Specialty Filter */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Medical Specialty
              </label>
              <select
                value={selectedSpecialtyId}
                onChange={(e) => onSpecialtyChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 bg-white focus:border-teal-600 focus:outline-none"
              >
                <option value="ALL">All Disciplines ({doctors.length})</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Experience */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Minimum Experience
              </label>
              <select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 bg-white focus:border-teal-600 focus:outline-none"
              >
                <option value={0}>Any Experience</option>
                <option value={5}>5+ Years Experience</option>
                <option value={10}>10+ Years Experience</option>
                <option value={15}>15+ Years Experience</option>
              </select>
            </div>

            {/* Max Consultation Fee in INR */}
            <div>
              <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
                <span>Max Consultation Fee</span>
                <span className="text-teal-800 font-bold">{formatINR(maxFeeFilter)}</span>
              </div>
              <input
                type="range"
                min="300"
                max="2000"
                step="50"
                value={maxFeeFilter}
                onChange={(e) => setMaxFeeFilter(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>₹300</span>
                <span>₹2,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Listings */}
        <div className="lg:col-span-9 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
            <span>
              Showing <strong className="text-slate-900">{filteredDoctors.length}</strong> available doctors in{' '}
              <strong className="text-teal-800">{cityNameHeader}</strong>
            </span>
            <span className="text-slate-500">Live IST Slots</span>
          </div>

          {filteredDoctors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-xs text-slate-500 space-y-2">
              <p className="font-semibold text-slate-700 text-sm">No doctors match your filter criteria.</p>
              <p className="max-w-md mx-auto">
                No specialists found in {cityNameHeader} with current filters. Try changing your specialty or resetting filters.
              </p>
              <button
                onClick={() => {
                  onSearchChange('');
                  onSpecialtyChange('ALL');
                  onCityChange('ALL');
                  setMaxFeeFilter(1500);
                  setExperienceFilter(0);
                }}
                className="rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
              >
                View All Doctors Across Tirupati & Chennai
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:border-slate-300 sm:flex sm:items-start sm:justify-between sm:gap-6"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={
                        doc.profileImageUrl ||
                        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400'
                      }
                      alt={doc.user?.fullName}
                      className="h-20 w-20 rounded-xl object-cover border border-slate-200 shrink-0"
                    />

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-base text-slate-900">
                          {doc.user?.fullName}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {doc.city}, {doc.state === 'Andhra Pradesh' ? 'AP' : 'TN'}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-teal-800">
                        {doc.specialty?.name}
                      </p>

                      <p className="text-xs text-slate-600 font-medium">{doc.qualifications}</p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{doc.clinicName}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{doc.experienceYears} Years Exp</span>
                        </span>
                        {doc.user?.phoneNumber && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{doc.user.phoneNumber}</span>
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 pt-0.5">
                        <MapPin className="inline h-3 w-3 text-slate-400 mr-1" />
                        {doc.clinicAddress}
                      </p>

                      <p className="text-xs text-slate-600 line-clamp-2 max-w-xl pt-1 leading-relaxed">
                        {doc.bio}
                      </p>
                    </div>
                  </div>

                  {/* Fee & Action */}
                  <div className="mt-4 sm:mt-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 shrink-0 sm:w-44">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-medium">Consultation Fee</span>
                      <p className="text-lg font-bold text-slate-900">{formatINR(doc.consultationFee)}</p>
                      <span className="text-[10px] text-slate-400">Pay at clinic</span>
                    </div>

                    <div className="sm:mt-3 flex sm:flex-col items-end gap-1.5 w-full">
                      <button
                        onClick={() => onSelectDoctor(doc)}
                        className="w-full rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <span>Book Appointment</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[10px] text-teal-700 font-medium hidden sm:inline">
                        • Live Slots in IST
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
