/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { DoctorDirectory } from './components/DoctorDirectory.tsx';
import { BookingModal } from './components/BookingModal.tsx';
import { PatientDashboard } from './components/PatientDashboard.tsx';
import { DoctorDashboard } from './components/DoctorDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { MonorepoViewer } from './components/MonorepoViewer.tsx';
import { Footer } from './components/Footer.tsx';
import { Doctor, Specialty, User, Appointment } from './types.ts';
import { clientApi, getStoredUser, clearStoredAuth, setStoredAuth } from './api.ts';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // City state - Default to Tirupati as per requirements
  const [selectedCity, setSelectedCity] = useState<'Tirupati' | 'Chennai' | 'ALL'>('Tirupati');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('ALL');

  // Modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRole, setAuthRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadInitialData = () => {
    clientApi
      .getSpecialties()
      .then((data: Specialty[]) => setSpecialties(data || []))
      .catch((err) => console.error('Failed to load specialties:', err));

    clientApi
      .getDoctors({ city: selectedCity !== 'ALL' ? selectedCity : undefined })
      .then((data: Doctor[]) => setDoctors(data || []))
      .catch((err) => console.error('Failed to load doctors:', err));

    // Verify current user session if token exists
    clientApi
      .getMe()
      .then((res: any) => {
        if (res?.user) setCurrentUser(res.user);
      })
      .catch(() => {
        // If token expired, clear
        clearStoredAuth();
        setCurrentUser(null);
      });
  };

  useEffect(() => {
    loadInitialData();
  }, [selectedCity]);

  // Quick switcher for mentors/evaluators to seamlessly test all 3 personas
  const handleQuickSwitchUser = async (role: 'PATIENT' | 'DOCTOR' | 'ADMIN') => {
    try {
      let credentials = { email: 'john.doe@example.com', password: 'Patient@123' };
      if (role === 'DOCTOR') {
        credentials = { email: 'dr.jenkins@medrella.com', password: 'Doctor@123' };
      } else if (role === 'ADMIN') {
        credentials = { email: 'admin@medrella.com', password: 'Admin@123' };
      }

      const res = await clientApi.login(credentials);
      setStoredAuth(res.token, res.user);
      setCurrentUser(res.user);

      // Route to role-specific workspace
      if (role === 'PATIENT') {
        setCurrentTab('patient-dashboard');
        showNotification('Switched to Patient: Johnathan Doe', 'success');
      } else if (role === 'DOCTOR') {
        setCurrentTab('doctor-dashboard');
        showNotification('Switched to Doctor: Dr. Sarah Jenkins (Cardiology)', 'success');
      } else if (role === 'ADMIN') {
        setCurrentTab('admin-dashboard');
        showNotification('Switched to System Administrator', 'success');
      }
    } catch (err: any) {
      showNotification(err.message || 'Quick login failed', 'error');
    }
  };

  const handleLogout = () => {
    clientApi.logout();
    setCurrentUser(null);
    setCurrentTab('home');
    showNotification('Logged out successfully', 'success');
  };

  const handleOpenAuth = (role: 'PATIENT' | 'DOCTOR' = 'PATIENT') => {
    setAuthRole(role);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    showNotification(`Signed in as ${user.fullName}`, 'success');

    if (user.role === 'PATIENT') setCurrentTab('patient-dashboard');
    else if (user.role === 'DOCTOR') setCurrentTab('doctor-dashboard');
    else if (user.role === 'ADMIN') setCurrentTab('admin-dashboard');
  };

  const handleSearchSubmit = (query: string, specialtyId?: string) => {
    setSearchQuery(query);
    if (specialtyId) setSelectedSpecialtyId(specialtyId);
    setCurrentTab('doctors');
  };

  const handleBookingSuccess = (appointment: Appointment) => {
    showNotification(`Appointment booked with ${appointment.doctor?.user?.fullName || 'the specialist'}!`, 'success');
    // Reload doctors/appointments
    clientApi.getDoctors().then((data) => setDoctors(data || []));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl ring-1 ring-white/10 animate-fade-in">
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        currentUser={currentUser}
        currentTab={currentTab}
        selectedCity={selectedCity}
        onSelectCity={(city) => {
          setSelectedCity(city);
        }}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onQuickSwitchUser={handleQuickSwitchUser}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <Hero
            specialties={specialties}
            featuredDoctors={doctors}
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
            onSearch={handleSearchSubmit}
            onSelectDoctor={(doc) => setSelectedDoctor(doc)}
            onSelectSpecialty={(specId) => {
              setSelectedSpecialtyId(specId);
              setCurrentTab('doctors');
            }}
          />
        )}

        {(currentTab === 'doctors' || currentTab === 'specialties') && (
          <DoctorDirectory
            doctors={doctors}
            specialties={specialties}
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
            selectedSpecialtyId={selectedSpecialtyId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSpecialtyChange={setSelectedSpecialtyId}
            onSelectDoctor={(doc) => setSelectedDoctor(doc)}
          />
        )}

        {currentTab === 'patient-dashboard' && (
          currentUser?.role === 'PATIENT' ? (
            <PatientDashboard
              currentUser={currentUser}
              onBookNew={() => {
                setCurrentTab('doctors');
              }}
            />
          ) : (
            <div className="mx-auto max-w-md my-16 rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
              <h3 className="font-bold text-slate-900">Patient Authentication Required</h3>
              <p className="text-xs text-slate-500">
                Please sign in as a patient to view your medical bookings and appointment history.
              </p>
              <button
                onClick={() => handleQuickSwitchUser('PATIENT')}
                className="w-full rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
              >
                Log in as Demo Patient
              </button>
            </div>
          )
        )}

        {currentTab === 'doctor-dashboard' && (
          currentUser?.role === 'DOCTOR' ? (
            <DoctorDashboard currentUser={currentUser} />
          ) : (
            <div className="mx-auto max-w-md my-16 rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
              <h3 className="font-bold text-slate-900">Doctor Authentication Required</h3>
              <p className="text-xs text-slate-500">
                Please sign in as a doctor to manage your clinic schedule and appointments.
              </p>
              <button
                onClick={() => handleQuickSwitchUser('DOCTOR')}
                className="w-full rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
              >
                Log in as Demo Doctor (Dr. Jenkins)
              </button>
            </div>
          )
        )}

        {currentTab === 'admin-dashboard' && (
          currentUser?.role === 'ADMIN' ? (
            <AdminDashboard />
          ) : (
            <div className="mx-auto max-w-md my-16 rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
              <h3 className="font-bold text-slate-900">Admin Portal Restricted</h3>
              <p className="text-xs text-slate-500">
                Please sign in as an Administrator to view platform statistics and approve doctors.
              </p>
              <button
                onClick={() => handleQuickSwitchUser('ADMIN')}
                className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700"
              >
                Log in as Demo Administrator
              </button>
            </div>
          )
        )}

        {currentTab === 'monorepo' && <MonorepoViewer />}
      </main>

      {/* Booking Modal */}
      {selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          currentUser={currentUser}
          onClose={() => setSelectedDoctor(null)}
          onSuccess={(appointment) => {
            handleBookingSuccess(appointment);
            // If patient is logged in, optionally switch to their dashboard
            if (currentUser?.role === 'PATIENT') {
              setCurrentTab('patient-dashboard');
            }
          }}
          onRequireAuth={() => {
            handleOpenAuth('PATIENT');
          }}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          initialRole={authRole}
          specialties={specialties}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Footer */}
      <Footer onSelectTab={(tab) => setCurrentTab(tab)} />
    </div>
  );
}
