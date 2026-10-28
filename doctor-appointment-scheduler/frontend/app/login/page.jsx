'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('john.doe@example.com');
  const [password, setPassword] = useState('Patient@123');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('medrella_token', res.token);
      if (res.user.role === 'PATIENT') router.push('/patient/dashboard');
      else if (res.user.role === 'DOCTOR') router.push('/doctor/dashboard');
      else if (res.user.role === 'ADMIN') router.push('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md my-16 px-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-700">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign in to Medrella</h1>
          <p className="text-xs text-slate-500">Access your appointments and healthcare dashboard</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-teal-600 py-3 font-bold text-white shadow-md hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">Sample Credentials:</p>
          <p>Patient: john.doe@example.com / Patient@123</p>
          <p>Doctor: dr.jenkins@medrella.com / Doctor@123</p>
          <p>Admin: admin@medrella.com / Admin@123</p>
        </div>
      </div>
    </div>
  );
}
