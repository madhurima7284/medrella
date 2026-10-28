import React from 'react';
import { HeartPulse, Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-white font-bold">
                <HeartPulse className="h-4 w-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">Medrella</span>
            </div>
            <p className="text-slate-500 max-w-sm leading-relaxed">
              Healthcare appointment scheduling connecting patients with verified medical doctors. Real-time availability, direct booking, and comprehensive clinical workflows.
            </p>
            <div className="flex items-center gap-1.5 text-slate-400 pt-1">
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              <span>Full-Stack Architecture • PostgreSQL • Prisma ORM</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-2.5">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Navigation</h4>
            <ul className="space-y-1.5 text-slate-600">
              <li>
                <button onClick={() => onSelectTab('home')} className="hover:text-teal-800 transition">
                  Find Doctors
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('doctors')} className="hover:text-teal-800 transition">
                  Doctor Directory
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('specialties')} className="hover:text-teal-800 transition">
                  Medical Specialties
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('monorepo')} className="hover:text-teal-800 transition">
                  Monorepo Code & API
                </button>
              </li>
            </ul>
          </div>

          {/* Medical Specialties */}
          <div className="lg:col-span-3 space-y-2.5">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Clinical Care</h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>General Medicine & Primary Care</li>
              <li>Cardiology & Preventative Health</li>
              <li>Clinical Dermatology & Skin Health</li>
              <li>Pediatrics & Child Wellness</li>
              <li>Orthopedics, Gynecology, ENT & Dentistry</li>
            </ul>
          </div>

          {/* Practice Contact */}
          <div className="lg:col-span-3 space-y-2.5">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Practice Contact (India)</h4>
            <div className="space-y-1.5 text-slate-500">
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-teal-700 shrink-0 mt-0.5" />
                <span>Renigunta Road, Near SVIMS, Tirupati, Andhra Pradesh 517507</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-teal-700 shrink-0 mt-0.5" />
                <span>Greams Road, Thousand Lights, Chennai, Tamil Nadu 600006</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                <span>+91 877 228 9000 / +91 94401 23456</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                <span>appointments@medrella.in</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} Medrella Healthcare India. Connecting patients with verified specialists in Tirupati, AP & Chennai, TN.</p>
        </div>
      </div>
    </footer>
  );
};
