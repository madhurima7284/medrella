import React, { useState } from 'react';
import {
  HeartPulse,
  User as UserIcon,
  Calendar,
  LogOut,
  ShieldCheck,
  Stethoscope,
  Code2,
  ChevronDown,
  Building2,
  MapPin,
  Check,
} from 'lucide-react';
import { User } from '../types.ts';

interface NavbarProps {
  currentUser: User | null;
  currentTab: string;
  selectedCity: 'Tirupati' | 'Chennai' | 'ALL';
  onSelectCity: (city: 'Tirupati' | 'Chennai' | 'ALL') => void;
  onSelectTab: (tab: string) => void;
  onOpenAuth: (role?: 'PATIENT' | 'DOCTOR') => void;
  onLogout: () => void;
  onQuickSwitchUser: (role: 'PATIENT' | 'DOCTOR' | 'ADMIN') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentTab,
  selectedCity,
  onSelectCity,
  onSelectTab,
  onOpenAuth,
  onLogout,
  onQuickSwitchUser,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Subdued Testing Toolbar for Mentors / Reviewers */}
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-1 text-[11px] text-slate-600">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-600" />
            <span className="font-medium text-slate-700">Medrella India Care</span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-500 hidden sm:inline">Tirupati (AP) & Chennai (TN) • IST Timezone</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 hidden md:inline">Test Roles:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onQuickSwitchUser('PATIENT')}
                className={`rounded px-2 py-0.5 font-medium transition ${
                  currentUser?.role === 'PATIENT'
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
                title="Switch to Demo Patient (Johnathan Doe)"
              >
                Patient
              </button>
              <button
                onClick={() => onQuickSwitchUser('DOCTOR')}
                className={`rounded px-2 py-0.5 font-medium transition ${
                  currentUser?.role === 'DOCTOR'
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
                title="Switch to Demo Doctor (Dr. Sarah Jenkins - Tirupati)"
              >
                Doctor
              </button>
              <button
                onClick={() => onQuickSwitchUser('ADMIN')}
                className={`rounded px-2 py-0.5 font-medium transition ${
                  currentUser?.role === 'ADMIN'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
                title="Switch to Demo Admin (System Admin)"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand + City Selector */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => onSelectTab('home')}
            className="flex cursor-pointer items-center gap-2.5 transition hover:opacity-95"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-900">Medrella</span>
              <span className="text-[11px] font-semibold text-teal-700">India</span>
            </div>
          </div>

          {/* Interactive City Selector */}
          <div className="relative">
            <button
              onClick={() => setShowCityMenu(!showCityMenu)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/90 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition shadow-2xs"
              title="Change practice city"
            >
              <MapPin className="h-3.5 w-3.5 text-teal-700 shrink-0" />
              <span>
                {selectedCity === 'Tirupati'
                  ? 'Tirupati, AP'
                  : selectedCity === 'Chennai'
                  ? 'Chennai, TN'
                  : 'All (AP & TN)'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showCityMenu && (
              <div className="absolute left-0 mt-1 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl ring-1 ring-slate-900/5 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Select Practice City (India)
                </div>
                <button
                  onClick={() => {
                    onSelectCity('Tirupati');
                    setShowCityMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition ${
                    selectedCity === 'Tirupati' ? 'text-teal-800 font-bold bg-teal-50/70' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-900">Tirupati</div>
                    <div className="text-[10px] text-slate-500">Andhra Pradesh (Default)</div>
                  </div>
                  {selectedCity === 'Tirupati' && (
                    <span className="text-[10px] bg-teal-700 text-white rounded px-1.5 py-0.5 font-bold">
                      Default
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    onSelectCity('Chennai');
                    setShowCityMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition ${
                    selectedCity === 'Chennai' ? 'text-teal-800 font-bold bg-teal-50/70' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-900">Chennai</div>
                    <div className="text-[10px] text-slate-500">Tamil Nadu</div>
                  </div>
                  {selectedCity === 'Chennai' && (
                    <span className="text-[10px] bg-teal-700 text-white rounded px-1.5 py-0.5 font-bold">
                      Active
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    onSelectCity('ALL');
                    setShowCityMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition border-t border-slate-100 ${
                    selectedCity === 'ALL' ? 'text-teal-800 font-bold bg-teal-50/70' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-900">All Cities</div>
                    <div className="text-[10px] text-slate-500">Tirupati & Chennai</div>
                  </div>
                  {selectedCity === 'ALL' && (
                    <span className="text-[10px] bg-teal-700 text-white rounded px-1.5 py-0.5 font-bold">
                      Active
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onSelectTab('home')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              currentTab === 'home'
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Find Doctors
          </button>
          <button
            onClick={() => onSelectTab('doctors')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              currentTab === 'doctors'
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Directory
          </button>
          <button
            onClick={() => onSelectTab('specialties')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              currentTab === 'specialties'
                ? 'bg-teal-50 text-teal-800 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Specialties
          </button>

          {/* Role-Specific Portal Button */}
          {currentUser?.role === 'PATIENT' && (
            <button
              onClick={() => onSelectTab('patient-dashboard')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                currentTab === 'patient-dashboard'
                  ? 'bg-teal-700 text-white'
                  : 'text-teal-700 bg-teal-50 hover:bg-teal-100/70'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              My Appointments
            </button>
          )}

          {currentUser?.role === 'DOCTOR' && (
            <button
              onClick={() => onSelectTab('doctor-dashboard')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                currentTab === 'doctor-dashboard'
                  ? 'bg-teal-700 text-white'
                  : 'text-teal-700 bg-teal-50 hover:bg-teal-100/70'
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              Doctor Workspace
            </button>
          )}

          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => onSelectTab('admin-dashboard')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                currentTab === 'admin-dashboard'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-800 bg-slate-100 hover:bg-slate-200/80'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Center
            </button>
          )}

          {/* Monorepo Architecture Explorer */}
          <button
            onClick={() => onSelectTab('monorepo')}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition border ${
              currentTab === 'monorepo'
                ? 'border-slate-300 bg-slate-100 text-slate-900 font-semibold'
                : 'border-slate-200/80 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Code2 className="h-3.5 w-3.5 text-slate-500" />
            <span>Monorepo & API</span>
          </button>
        </nav>

        {/* Right Auth / Profile Section */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-[11px] font-semibold text-white">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="font-semibold text-slate-900 leading-none">
                    {currentUser.fullName}
                  </span>
                  <span className="ml-1 text-[10px] text-slate-400 capitalize">
                    ({currentUser.role.toLowerCase()})
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg ring-1 ring-slate-900/5 z-50 text-xs"
                  onClick={() => setShowUserMenu(false)}
                >
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="font-bold text-slate-900">{currentUser.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <span className="mt-1 inline-block rounded bg-teal-50 px-2 py-0.2 text-[10px] font-bold text-teal-800">
                      {currentUser.role}
                    </span>
                  </div>

                  {currentUser.role === 'PATIENT' && (
                    <button
                      onClick={() => onSelectTab('patient-dashboard')}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                    >
                      <Calendar className="h-3.5 w-3.5 text-teal-700" />
                      My Appointments
                    </button>
                  )}

                  {currentUser.role === 'DOCTOR' && (
                    <button
                      onClick={() => onSelectTab('doctor-dashboard')}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                    >
                      <Stethoscope className="h-3.5 w-3.5 text-teal-700" />
                      Doctor Workspace
                    </button>
                  )}

                  {currentUser.role === 'ADMIN' && (
                    <button
                      onClick={() => onSelectTab('admin-dashboard')}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-700" />
                      Admin Dashboard
                    </button>
                  )}

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('PATIENT')}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('PATIENT')}
                className="rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 transition"
              >
                Book Appointment
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
