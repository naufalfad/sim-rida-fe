'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
  ShieldCheck,
  Lock,
  User as UserIcon,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!identifier.trim() || !password.trim()) {
      setLocalError('Silakan masukkan Email / NIP dan Kata Sandi.');
      return;
    }

    try {
      await login({
        identifier: identifier.trim(),
        password: password,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setLocalError(err.message || 'Login gagal. Silakan periksa kembali email/NIP dan kata sandi Anda.');
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 font-sans py-12">
      <div className="w-full max-w-md bg-white p-8 border border-slate-300 shadow-xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-[#0f2c59] text-white shadow-sm mb-1">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#0f2c59]">
            SIM-RIDA
          </h2>
          <p className="text-[11px] text-slate-600 uppercase tracking-widest font-bold">
            Sistem Informasi Riset dan Inovasi Daerah
          </p>
          <div className="w-12 h-1 bg-[#0f2c59] mx-auto mt-2" />
        </div>

        {/* Error Alert */}
        {activeError && (
          <div className="p-3 bg-slate-100 border border-black text-xs text-slate-900 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-blue-700" />
            <div className="flex-1 font-semibold">{activeError}</div>
          </div>
        )}

        {/* Form Login Manual */}
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Email atau NIP
            </label>
            <div className="relative">
              <UserIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={identifier}
                disabled={isLoading}
                autoFocus
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (activeError) {
                    clearError();
                    setLocalError(null);
                  }
                }}
                placeholder="Masukkan email (contoh: admin@simrida.local) atau NIP"
                className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-white placeholder:text-slate-400 border border-slate-300 focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] outline-none transition disabled:bg-slate-100 font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-800">
                Kata Sandi
              </label>
            </div>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                disabled={isLoading}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (activeError) {
                    clearError();
                    setLocalError(null);
                  }
                }}
                placeholder="Masukkan kata sandi akun"
                className="w-full pl-9 pr-10 py-2.5 text-xs text-slate-900 bg-white placeholder:text-slate-400 border border-slate-300 focus:border-[#0f2c59] focus:ring-1 focus:ring-[#0f2c59] outline-none transition disabled:bg-slate-100 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#0f2c59] hover:bg-[#1b3b6f] text-white text-xs font-bold uppercase tracking-wider transition-all shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memverifikasi Kredensial...</span>
              </>
            ) : (
              <span>Masuk Aplikasi</span>
            )}
          </button>
        </form>

        {/* Informasi Kredensial Pengujian (Reference Only) */}
        <div className="pt-4 border-t border-slate-200">
          <div className="bg-slate-50 border border-slate-200 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Info className="h-3.5 w-3.5 text-[#0f2c59] shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0f2c59]">
                Petunjuk Kredensial Akun (Database Seed)
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Semua akun menggunakan kata sandi: <strong className="text-slate-800 font-mono">password123</strong>
            </p>
            <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-700">
              <div>• <strong>Admin BRIDA:</strong> <code className="bg-slate-200/70 px-1 py-0.5 text-slate-800">admin@simrida.local</code></div>
              <div>• <strong>Kepala BRIDA:</strong> <code className="bg-slate-200/70 px-1 py-0.5 text-slate-800">kepala@simrida.local</code></div>
              <div>• <strong>OPD (Bappeda):</strong> <code className="bg-slate-200/70 px-1 py-0.5 text-slate-800">bappeda@simrida.local</code></div>
              <div>• <strong>OPD (Dinkes):</strong> <code className="bg-slate-200/70 px-1 py-0.5 text-slate-800">dinkes@simrida.local</code></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
