import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Stethoscope,
  Lock,
  Mail,
  Phone,
  AlertCircle,
  Loader2,
  Key,
} from 'lucide-react';
import { Specialty, User } from '../types.ts';
import { clientApi, setStoredAuth } from '../api.ts';

interface AuthModalProps {
  initialRole?: 'PATIENT' | 'DOCTOR';
  specialties: Specialty[];
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialRole = 'PATIENT',
  specialties,
  onClose,
  onSuccess,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>(initialRole);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Doctor Fields
  const [city, setCity] = useState<'Tirupati' | 'Chennai'>('Tirupati');
  const [specialtyId, setSpecialtyId] = useState(specialties[0]?.id || 'spec-cardio');
  const [qualifications, setQualifications] = useState('MBBS, MD');
  const [experienceYears, setExperienceYears] = useState(8);
  const [consultationFee, setConsultationFee] = useState(600);
  const [clinicName, setClinicName] = useState('Sri Venkateswara Clinic');
  const [clinicAddress, setClinicAddress] = useState('Balaji Colony, Tirupati, Andhra Pradesh 517501');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const payload = {
          fullName,
          email,
          password,
          role,
          phoneNumber: phoneNumber || '+91 98480 00000',
          ...(role === 'DOCTOR'
            ? {
                city,
                state: city === 'Chennai' ? 'Tamil Nadu' : 'Andhra Pradesh',
                specialtyId,
                qualifications,
                experienceYears,
                consultationFee,
                clinicName,
                clinicAddress,
              }
            : {}),
        };
        const res = await clientApi.register(payload);
        setStoredAuth(res.token, res.user);
        onSuccess(res.user);
      } else {
        const res = await clientApi.login({ email, password });
        setStoredAuth(res.token, res.user);
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (type: 'PATIENT' | 'DOCTOR' | 'ADMIN') => {
    setIsRegister(false);
    setError(null);
    if (type === 'PATIENT') {
      setEmail('john.doe@example.com');
      setPassword('Patient@123');
    } else if (type === 'DOCTOR') {
      setEmail('dr.jenkins@medrella.com');
      setPassword('Doctor@123');
    } else if (type === 'ADMIN') {
      setEmail('admin@medrella.com');
      setPassword('Admin@123');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/5 my-6 text-xs">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center mb-5">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {isRegister ? 'Register Account' : 'Sign in to Medrella'}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isRegister
              ? 'Join as a patient or healthcare practitioner'
              : 'Access your appointments and clinical records'}
          </p>
        </div>

        {/* Demo Fast Login Pills */}
        {!isRegister && (
          <div className="mb-5 rounded-xl bg-slate-50 p-3 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 mb-2">
              <Key className="h-3.5 w-3.5 text-slate-400" />
              Preconfigured Test Accounts
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleFillDemo('PATIENT')}
                className="rounded-lg border border-slate-200 bg-white py-1.5 text-center font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('DOCTOR')}
                className="rounded-lg border border-slate-200 bg-white py-1.5 text-center font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('ADMIN')}
                className="rounded-lg border border-slate-200 bg-white py-1.5 text-center font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Admin
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3.5 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('PATIENT')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-semibold border transition ${
                    role === 'PATIENT'
                      ? 'border-teal-700 bg-teal-50 text-teal-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UserIcon className="h-3.5 w-3.5" /> Patient
                </button>
                <button
                  type="button"
                  onClick={() => setRole('DOCTOR')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-semibold border transition ${
                    role === 'DOCTOR'
                      ? 'border-teal-700 bg-teal-50 text-teal-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Stethoscope className="h-3.5 w-3.5" /> Doctor
                </button>
              </div>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={role === 'DOCTOR' ? 'Dr. Alexander King' : 'Jane Doe'}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-700"
              />
            </div>
          )}

          {/* Doctor specific registration fields */}
          {isRegister && role === 'DOCTOR' && (
            <div className="space-y-2.5 rounded-xl bg-slate-50 border border-slate-200 p-3">
              <span className="text-[11px] font-semibold text-slate-700 uppercase block">
                Doctor Practice Details
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Specialty
                  </label>
                  <select
                    value={specialtyId}
                    onChange={(e) => setSpecialtyId(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs text-slate-800"
                  >
                    {specialties.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Consultation Fee (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Practice City
                  </label>
                  <select
                    value={city}
                    onChange={(e) => {
                      const newCity = e.target.value as 'Tirupati' | 'Chennai';
                      setCity(newCity);
                      if (newCity === 'Tirupati') {
                        setClinicAddress('Balaji Colony, Tirupati, Andhra Pradesh 517501');
                      } else {
                        setClinicAddress('Greams Road, Thousand Lights, Chennai, Tamil Nadu 600006');
                      }
                    }}
                    className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs text-slate-800"
                  >
                    <option value="Tirupati">Tirupati (Andhra Pradesh)</option>
                    <option value="Chennai">Chennai (Tamil Nadu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Qualifications
                  </label>
                  <input
                    type="text"
                    value={qualifications}
                    onChange={(e) => setQualifications(e.target.value)}
                    placeholder="e.g. MBBS, MD, DM"
                    className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Clinic or Hospital Details
                </label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Clinic Name (e.g. Balaji Medical Clinic)"
                  className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs text-slate-800 mb-1"
                />
                <input
                  type="text"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  placeholder="Clinic Address (in Tirupati or Chennai)"
                  className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs text-slate-800"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-teal-700 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:opacity-50 transition"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Authenticating...
              </span>
            ) : isRegister ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-[11px] text-slate-500 border-t border-slate-100 pt-3">
          {isRegister ? (
            <span>
              Already registered?{' '}
              <button
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className="font-semibold text-teal-800 hover:underline"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Need an account?{' '}
              <button
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className="font-semibold text-teal-800 hover:underline"
              >
                Register
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
