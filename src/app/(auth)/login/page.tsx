'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Eye, EyeOff, Lock, Mail, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error: storeError, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  // If already authenticated, redirect immediately to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Field validation
    if (!email.trim()) {
      setValidationError('Email harus diisi.');
      return;
    }
    if (!password) {
      setValidationError('Password harus diisi.');
      return;
    }

    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (err) {
      // Error handles in auth store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 font-sans">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg mb-2">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-905 dark:text-white">
            SIM-RIDA
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-450 uppercase tracking-wider font-semibold">
            Sistem Informasi Manajemen Riset Daerah
          </p>
          <div className="w-12 h-1 bg-blue-600 mx-auto rounded-full mt-2" />
        </div>

        {/* Credentials Info Box */}
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 rounded p-3 text-xs space-y-1.5 text-gray-600 dark:text-gray-400">
          <p className="font-bold text-gray-800 dark:text-gray-300">Akses Demo:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Admin</strong>: admin@simrida.local</li>
            <li><strong>BRIDA</strong>: brida@simrida.local</li>
            <li><strong>Kepala BRIDA</strong>: kepala@simrida.local</li>
            <li><strong>Password</strong>: password</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {(storeError || validationError) && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-750 dark:text-red-400 text-xs rounded p-3">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{validationError || storeError}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@simrida.local"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-850 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-650 focus:border-blue-650"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-850 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-650 focus:border-blue-650"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-650"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Masuk...</span>
              </>
            ) : (
              'Masuk ke SIM-RIDA'
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-150 dark:border-gray-750 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">
            SIM-RIDA Demo Environment
          </p>
        </div>
      </div>
    </div>
  );
}
