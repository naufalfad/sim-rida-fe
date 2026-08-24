'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  X,
  Bell,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FileSpreadsheet,
  FilePlus2,
  Settings,
  ClipboardList,
  CheckSquare,
  Eye,
  FileBadge,
  ShieldCheck,
  FolderLock,
  Award,
  FileCheck,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { proposalService } from '@/lib/api/proposals';
import { cn } from '@/lib/utils/cn';
import { UserRole } from '@/constants/roles';
import { useAuthStore } from '@/store/useAuthStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser, isAuthenticated, logout, isLoading: authLoading } = useAuthStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Usulan baru PRP-2026-001 butuh verifikasi', read: false },
    { id: 2, text: 'Laporan Monitoring Semester I telah diunggah', read: true },
  ]);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Memuat Sesi...</span>
        </div>
      </div>
    );
  }

  // Sidebar navigation configuration based on role
  const getNavLinks = (role: UserRole) => {
    switch (role) {
      case 'OPD':
        return [
          { name: 'Dashboard', path: '/opd/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
          { name: 'Usulan Riset', path: '/opd/usulan', icon: <FilePlus2 className="h-5 w-5" /> },
          { name: 'Implementasi E-Katalog', path: '/opd/implementasi', icon: <ClipboardList className="h-5 w-5" /> },
          { name: 'Tindak Lanjut', path: '/opd/tindak-lanjut', icon: <CheckSquare className="h-5 w-5" /> },
        ];
      case 'BRIDA':
        return [
          { name: 'Dashboard', path: '/brida/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
          { name: 'Daftar Usulan', path: '/brida/usulan', icon: <FileSpreadsheet className="h-5 w-5" /> },
          { name: 'Verifikasi Administrasi', path: '/brida/verifikasi', icon: <ShieldCheck className="h-5 w-5" /> },
          { name: 'Review Substansi', path: '/brida/review', icon: <Eye className="h-5 w-5" /> },
          { name: 'Seleksi Prioritas', path: '/brida/seleksi', icon: <FolderLock className="h-5 w-5" /> },
          { name: 'Monitoring Implementasi', path: '/brida/monitoring', icon: <ClipboardList className="h-5 w-5" /> },
          { name: 'Review Laporan OPD', path: '/brida/laporan', icon: <FileCheck className="h-5 w-5" /> },
          { name: 'Policy Brief', path: '/brida/policy-brief', icon: <FileBadge className="h-5 w-5" /> },
          { name: 'Rekomendasi Bupati', path: '/brida/rekomendasi', icon: <Award className="h-5 w-5" /> },
          { name: 'Tindak Lanjut OPD', path: '/brida/tindak-lanjut', icon: <CheckSquare className="h-5 w-5" /> },
        ];
      case 'KEPALA_BRIDA':
        return [
          { name: 'Dashboard Strategis', path: '/kepala-brida/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
          { name: 'Persetujuan Seleksi', path: '/kepala-brida/persetujuan-seleksi', icon: <ShieldCheck className="h-5 w-5" /> },
          { name: 'Persetujuan Rekomendasi', path: '/kepala-brida/persetujuan-rekomendasi', icon: <Award className="h-5 w-5" /> },
          { name: 'Persetujuan Laporan', path: '/kepala-brida/persetujuan-laporan', icon: <FileCheck className="h-5 w-5" /> },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks(currentUser.role as UserRole);

  // Generate breadcrumb path labels
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((seg, idx) => {
      const path = '/' + segments.slice(0, idx + 1).join('/');
      const isLast = idx === segments.length - 1;
      const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace('-', ' ');
      return { path, label, isLast };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  const profileMenuItems: DropdownItem[] = [
    {
      id: 'profile-info',
      label: currentUser.name,
      disabled: true,
      className: 'font-semibold text-slate-900 dark:text-white',
    },
    {
      id: 'profile-dept',
      label: currentUser.role || '-',
      disabled: true,
      className: 'text-xs text-slate-500 dark:text-slate-450 pb-2 border-b dark:border-slate-800',
    },
    // Removed demo switch links since we are using real API
    {
      id: 'reset-demo',
      label: 'Reset Seluruh Data Demo',
      icon: <RotateCcw className="h-4 w-4 text-amber-500" />,
      onClick: () => {
        if (confirm('Apakah Anda yakin ingin mereset seluruh data simulasi ke kondisi awal?')) {
          proposalService.resetDemoData();
        }
      },
      className: 'text-amber-700 hover:bg-amber-50 border-t pt-2 mt-2 dark:hover:bg-amber-950/20 text-[11px] font-bold',
    },
    {
      id: 'logout',
      label: 'Keluar Aplikasi',
      icon: <LogOut className="h-4 w-4" />,
      onClick: handleLogout,
      className: 'text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 border-t pt-2 mt-1',
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. SIDEBAR (Desktop) */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 z-20 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                SR
              </div>
              <span className="font-bold text-white text-lg tracking-wider">SIM-RIDA</span>
            </div>
          )}
          {isSidebarCollapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
              SR
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="rounded-lg p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white focus:outline-none"
          >
            {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.path || pathname.startsWith(link.path + '/');
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                  {link.icon}
                </span>
                {!isSidebarCollapsed && <span className="truncate">{link.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User profile brief */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700">
              {currentUser.name.charAt(0)}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{currentUser.role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MOBILE NAVIGATION DRAWER */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Mobile overlay backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />

          <div className="relative flex w-full max-w-xs flex-col bg-slate-900 text-slate-300 p-5 shadow-2xl animate-slide-in">
            {/* Close Button */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                  SR
                </div>
                <span className="font-bold text-white text-lg tracking-wider">SIM-RIDA</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="rounded-lg p-1.5 hover:bg-slate-800 text-slate-400 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'
                    }`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer Profile info */}
            <div className="pt-5 border-t border-slate-800 flex items-center gap-3 mt-auto">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-350 font-bold border border-slate-700">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT BODY */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 shadow-sm z-10">
          {/* Mobile menu trigger + Breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-655 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Breadcrumb Display */}
            <nav className="hidden sm:flex items-center text-sm text-slate-500 dark:text-slate-400 font-medium">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                SIM-RIDA
              </Link>
              {breadcrumbs.map((crumb) => (
                <React.Fragment key={crumb.path}>
                  <span className="mx-2 text-slate-400">/</span>
                  {crumb.isLast ? (
                    <span className="text-slate-800 dark:text-slate-100 font-semibold truncate max-w-[150px]">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link href={crumb.path} className="hover:text-blue-655 transition-colors truncate max-w-[150px]">
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Action Icons & User Dropdowns */}
          <div className="flex items-center gap-3">
            {/* Notification Badge Dropdown */}
            <Dropdown
              align="right"
              trigger={
                <button className="relative p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none">
                  <Bell className="h-5 w-5" />
                  {notifications.some((n) => !n.read) && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-550 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </button>
              }
              items={notifications.map((n) => ({
                id: `notif-${n.id}`,
                label: n.text,
                onClick: () => {
                  setNotifications(notifications.map((item) => item.id === n.id ? { ...item, read: true } : item));
                },
                className: cn('text-xs py-2', !n.read && 'font-semibold bg-slate-50/50 dark:bg-slate-850/30'),
              }))}
            />

            {/* Divider */}
            <span className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800" />

            {/* Profile Dropdown */}
            <Dropdown
              align="right"
              trigger={
                <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none">
                  <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 font-bold flex items-center justify-center border border-blue-200 dark:border-blue-900">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {currentUser.email}
                  </span>
                </button>
              }
              items={profileMenuItems}
            />
          </div>
        </header>

        {/* Dashboard Main Workspace Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-slate-955">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
