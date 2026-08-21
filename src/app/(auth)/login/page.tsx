'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ShieldAlert, Award, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, isLoading, error: storeError } = useAuthStore();
  const [localError, setLocalError] = useState('');

  const errorMsg = storeError || localError;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    try {
      await login({ 
        email: emailOrUsername,
        password 
      });
      
      // Redirect to dashboard on success based on role
      const { user } = useAuthStore.getState();
      let path = '/login';
      if (user?.role === 'OPD') path = '/opd/dashboard';
      else if (user?.role === 'BRIDA') path = '/brida/dashboard';
      else if (user?.role === 'KEPALA_BRIDA') path = '/kepala-brida/dashboard';
      else if (user?.role === 'RESEARCHER') path = '/researcher/dashboard';
      else path = '/dashboard';
      
      router.push(path);
    } catch (err: any) {
      // Error is handled in the store, but we can set local errors if needed
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden font-sans">
      {/* Decorative gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/30 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-3xl" />

      {/* Content wrapper */}
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="flex flex-col items-center mb-8 text-center">
          {/* Logo placeholder with government shield styling */}
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white shadow-xl mb-4">
            <Award className="h-9 w-9 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            SIM-RIDA
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            Sistem Informasi Manajemen Riset Daerah Badan Riset dan Inovasi Daerah
          </p>
        </div>

        {/* Card containing login form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-md p-8 shadow-2xl text-slate-100">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6">
            <KeyRound className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Authentication</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {errorMsg && (
              <div className="flex items-start gap-2 rounded-lg bg-red-950/50 border border-red-900/50 p-3 text-sm text-red-400">
                <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Username/Email Input */}
            <div>
              <Input
                label="Username / Email"
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="Masukkan username atau email"
                className="bg-slate-900 border-slate-800 text-slate-200 focus:ring-blue-550 placeholder:text-slate-700"
                required
              />
            </div>

            {/* Password input */}
            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-900 border-slate-800 text-slate-200 focus:ring-blue-550 placeholder:text-slate-700"
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white font-medium"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Sedang masuk...' : 'Masuk ke Dashboard'}
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-6 flex items-center justify-center gap-1">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>SIM-RIDA Secure Login</span>
        </p>
      </div>
    </div>
  );
}
