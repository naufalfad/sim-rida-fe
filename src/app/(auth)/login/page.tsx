'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ShieldAlert, Award, FileText, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { authService } from '@/lib/api/auth';
import { MOCK_USERS } from '@/lib/mock/users';
import { UserRole } from '@/constants/roles';

export default function LoginPage() {
  const router = useRouter();
  const [selectedProfileId, setSelectedProfileId] = useState(MOCK_USERS[0].id);
  const [username, setUsername] = useState(MOCK_USERS[0].username);
  const [role, setRole] = useState<UserRole>(MOCK_USERS[0].role);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Update form fields when pre-set profile is selected
  useEffect(() => {
    const user = MOCK_USERS.find((u) => u.id === selectedProfileId);
    if (user) {
      setUsername(user.username);
      setRole(user.role);
      setErrorMsg('');
    }
  }, [selectedProfileId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const user = await authService.login(username, role);
      if (user) {
        // Redirect to respective dashboard
        let path = '/login';
        if (user.role === 'OPD') path = '/opd/dashboard';
        else if (user.role === 'BRIDA') path = '/brida/dashboard';
        else if (user.role === 'KEPALA_BRIDA') path = '/kepala-brida/dashboard';
        else if (user.role === 'RESEARCHER') path = '/researcher/dashboard';

        router.push(path);
      } else {
        setErrorMsg('Username tidak terdaftar untuk role yang dipilih.');
      }
    } catch {
      setErrorMsg('Gagal melakukan login. Silakan coba kembali.');
    } finally {
      setIsLoading(false);
    }
  };

  const profileOptions = MOCK_USERS.map((user) => {
    let roleLabel = '';
    if (user.role === 'OPD') roleLabel = 'Demo OPD';
    else if (user.role === 'BRIDA') roleLabel = 'Demo BRIDA';
    else if (user.role === 'KEPALA_BRIDA') roleLabel = 'Demo Kepala BRIDA';
    else if (user.role === 'RESEARCHER') roleLabel = 'Demo Peneliti';

    return {
      value: user.id,
      label: `${roleLabel} - ${user.name}`,
    };
  });

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
            <h2 className="text-lg font-semibold">Demo Authentication</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {errorMsg && (
              <div className="flex items-start gap-2 rounded-lg bg-red-950/50 border border-red-900/50 p-3 text-sm text-red-400">
                <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick Credentials Selection */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-350">
                Pilih Akun Demo (Role)
              </label>
              <Select
                options={profileOptions}
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="bg-slate-900 border-slate-800 text-slate-200 focus:ring-blue-550"
              />
            </div>

            {/* Username Input */}
            <div>
              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="bg-slate-900 border-slate-800 text-slate-200 focus:ring-blue-550 placeholder:text-slate-700"
                required
              />
            </div>

            {/* Password input - placeholder */}
            <div>
              <Input
                label="Password (Demo)"
                type="password"
                value="••••••••"
                disabled
                className="bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white font-medium"
              isLoading={isLoading}
            >
              Masuk ke Dashboard
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-6 flex items-center justify-center gap-1">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Fase 7: Full End-to-End Demo & Final Polish</span>
        </p>
      </div>
    </div>
  );
}
