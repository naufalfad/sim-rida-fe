'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
  ShieldCheck,
  Building,
  UserCheck,
  Award,
  Settings,
  ArrowRight,
  Lock,
  Mail,
  Sparkles
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginAsMock, login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleQuickLogin = (role: 'OPD' | 'ADMIN_BRIDA' | 'KEPALA_BRIDA') => {
    loginAsMock(role);
    router.push('/dashboard');
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email: email || 'opd.bappeda@slemankab.go.id', password: password || 'password' });
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 font-sans py-12">
      <div className="w-full max-w-lg space-y-6 bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl mb-1 shadow-sm">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            SIM-RIDA
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">
            Sistem Informasi Manajemen Riset Daerah
          </p>
          <div className="w-12 h-1 bg-emerald-600 mx-auto rounded-full mt-2" />
        </div>

        {/* 1-Click Mock Role Selector */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>Pilih Akses Role (1-Click Masuk):</span>
          </div>

          <div className="grid gap-2.5">
            {/* OPD Button */}
            <button
              onClick={() => handleQuickLogin('OPD')}
              className="w-full p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="p-1.5 bg-white/20 rounded-md">
                  <Building className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="block font-black text-sm">Masuk Sebagai OPD (User)</span>
                  <span className="block text-[11px] text-emerald-100 font-normal">Pengusul Masalah Pembangunan & Penerima Rekomendasi</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Admin BRIDA Button */}
            <button
              onClick={() => handleQuickLogin('ADMIN_BRIDA')}
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-md">
                  <Settings className="h-4 w-4" />
                </div>
                <div>
                  <span className="block font-bold">Masuk Sebagai Admin BRIDA</span>
                  <span className="block text-[10px] text-gray-500 font-normal">Gatekeeper Verifikasi, Scoring, Manajemen Riset, Policy Brief & Master Data</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-1 transition-all" />
            </button>

            {/* Kepala BRIDA Button */}
            <button
              onClick={() => handleQuickLogin('KEPALA_BRIDA')}
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="p-1.5 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-md">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <span className="block font-bold">Masuk Sebagai Kepala BRIDA</span>
                  <span className="block text-[10px] text-gray-500 font-normal">Persetujuan Riset & Tanda Tangan Elektronik (TTE) Naskah Kebijakan</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-3xs uppercase">
            <span className="bg-white dark:bg-gray-800 px-2 text-gray-400 font-semibold">
              Atau Masuk dengan Email & Password
            </span>
          </div>
        </div>

        {/* Optional Manual Form */}
        <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-2xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Email</label>
            <div className="relative">
              <Mail className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@simrida.local"
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-950"
              />
            </div>
          </div>

          <div>
            <label className="block text-2xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-950"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-md text-xs font-bold transition-all"
          >
            Masuk
          </button>
        </form>

      </div>
    </div>
  );
}
