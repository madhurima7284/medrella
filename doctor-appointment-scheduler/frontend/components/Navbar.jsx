'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { HeartPulse, User as UserIcon, Calendar, LogOut, Stethoscope, ShieldCheck } from 'lucide-react';
import { fetchApi } from '../lib/api';

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchApi('/auth/me')
      .then((res) => {
        if (res?.user) setUser(res.user);
      })
      .catch(() => setUser(null));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('medrella_token');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-slate-900">Medrella</span>
              <span className="rounded bg-teal-100 px-1.5 py-0.2 text-[10px] font-semibold text-teal-800">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">Doctor Appointment Scheduler</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          <Link href="/" className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Find Care
          </Link>
          <Link href="/doctors" className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Doctor Directory
          </Link>
          {user?.role === 'PATIENT' && (
            <Link href="/patient/dashboard" className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700">
              <Calendar className="h-4 w-4" />
              My Appointments
            </Link>
          )}
          {user?.role === 'DOCTOR' && (
            <Link href="/doctor/dashboard" className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700">
              <Stethoscope className="h-4 w-4" />
              Doctor Workspace
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/admin/dashboard" className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-sm font-semibold text-purple-700">
              <ShieldCheck className="h-4 w-4" />
              Admin Center
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                {user.fullName} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Sign In
              </Link>
              <Link
                href="/doctors"
                className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
              >
                <UserIcon className="h-4 w-4" /> Book Appointment
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
