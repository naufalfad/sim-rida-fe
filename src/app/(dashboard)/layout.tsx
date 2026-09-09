'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Settings,
  FileText,
  ClipboardList,
  Activity,
  Award,
  ClipboardCheck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Bell,
  LogOut,
  User as UserIcon,
  FileCheck,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils/cn';

// Route restriction rules
const ALLOWED_ROUTES: Record<string, string[]> = {
  ADMIN_BRIDA: ['/dashboard', '/admin', '/opd', '/executive'],
  KEPALA_BRIDA: ['/dashboard', '/executive', '/opd'],
  OPD: ['/dashboard', '/opd'],
};

// Map roles to readable labels
const ROLE_LABELS: Record<string, string> = {
  ADMIN_BRIDA: 'Admin Litbang BRIDA',
  KEPALA_BRIDA: 'Kepala BRIDA',
  OPD: 'Perangkat Daerah (OPD)',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: currentUser, isAuthenticated, logout } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Authentication guard
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isAuthenticated, router]);

  // Route authorization guard
  useEffect(() => {
    if (mounted && isAuthenticated && currentUser) {
      const allowed = ALLOWED_ROUTES[currentUser.role] || [];
      const baseRoute = pathname.split('/').slice(0, 2).join('/');

      if (!allowed.includes(baseRoute)) {
        router.replace('/unauthorized');
      }
    }
  }, [mounted, isAuthenticated, currentUser, pathname, router]);

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-[#0f2c59] border-t-transparent animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#0f2c59]">Memuat Sesi Pengguna...</span>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  interface NavLink {
    name: string;
    path: string;
    icon: React.ReactNode;
    sublinks?: { name: string; path: string }[];
  }

  // Navigation items based on role
  const getNavLinks = (role: string): NavLink[] => {
    switch (role) {
      case 'ADMIN_BRIDA':
        return [
          { name: 'Dashboard & Analitik', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { name: 'Verifikasi Gatekeeper', path: '/admin/verification', icon: <ClipboardList className="h-4 w-4" /> },
          { name: 'Penelaahan & Scoring', path: '/admin/scoring', icon: <Award className="h-4 w-4" /> },
          { name: 'Manajemen Kajian Riset', path: '/admin/research', icon: <Activity className="h-4 w-4" /> },
          { name: 'Penyusunan Rekomendasi', path: '/admin/recommendation-builder', icon: <FileText className="h-4 w-4" /> },
          { name: 'Master Data & Konfigurasi', path: '/admin/master-data', icon: <Settings className="h-4 w-4" /> },
        ];
      case 'KEPALA_BRIDA':
        return [
          { name: 'Executive Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { name: 'Approval Usulan Riset', path: '/executive/approvals', icon: <ClipboardCheck className="h-4 w-4" /> },
          { name: 'Monitoring Kinerja Riset', path: '/executive/monitoring', icon: <Activity className="h-4 w-4" /> },
          { name: 'Pengesahan & TTE Dokumen', path: '/executive/legalization', icon: <FileCheck className="h-4 w-4" /> },
          { name: 'Analisis Pemanfaatan', path: '/executive/impact-tracking', icon: <TrendingUp className="h-4 w-4" /> },
        ];
      case 'OPD':
        return [
          { name: 'Dashboard Usulan OPD', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { name: 'Form Pengajuan Riset', path: '/opd/proposals/new', icon: <FileText className="h-4 w-4" /> },
          { name: 'Riwayat & Pelacakan Usulan', path: '/opd/tracking', icon: <Activity className="h-4 w-4" /> },
          { name: 'Gudang Rekomendasi Kebijakan', path: '/opd/recommendations', icon: <Award className="h-4 w-4" /> },
          { name: 'Tindak Lanjut Rekomendasi', path: '/opd/follow-up', icon: <ClipboardCheck className="h-4 w-4" /> },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks(currentUser.role);

  // Generate breadcrumb mapping
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
  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard';

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">

      {/* ================= SIDEBAR (DESKTOP) ================= */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-[#1b3b6f] bg-[#0f2c59] text-white transition-all duration-200 relative shrink-0 z-30',
          isSidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 border-b border-[#1b3b6f] justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-[#0a1e3f] text-white border border-[#264978] shrink-0">
              <ShieldCheck className="h-5 w-5 text-sky-400" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-wider uppercase text-white leading-none">
                  SIM-RIDA
                </span>
                <span className="text-[10px] text-slate-300 font-medium tracking-wide mt-1 uppercase">
                  Kabupaten Mimika
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.path || pathname.startsWith(link.path + '/');

            return (
              <Link
                key={link.name}
                href={link.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-xs font-semibold tracking-wider uppercase transition-colors group relative',
                  isActive
                    ? 'bg-[#1b3b6f] text-white border-l-4 border-l-sky-400 font-bold'
                    : 'text-slate-300 hover:bg-[#15325b] hover:text-white border-l-4 border-l-transparent'
                )}
                title={isSidebarCollapsed ? link.name : undefined}
              >
                <span className={cn('shrink-0', isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-white')}>
                  {link.icon}
                </span>
                {!isSidebarCollapsed && <span className="truncate">{link.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute top-20 -right-3 h-6 w-6 bg-[#0f2c59] border border-[#264978] flex items-center justify-center text-slate-300 hover:text-white z-40 shadow-sm"
        >
          {isSidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        {/* Sidebar Footer User Card */}
        <div className="border-t border-[#1b3b6f] p-4 bg-[#0a1e3f]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 bg-[#1b3b6f] border border-[#264978] flex items-center justify-center text-xs font-bold text-sky-300 uppercase shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate leading-none mb-1">
                  {currentUser.name}
                </p>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                  {ROLE_LABELS[currentUser.role] || currentUser.role}
                </span>
              </div>
            )}
          </div>
          {!isSidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-1.5 border border-[#264978] hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 text-xs font-semibold tracking-wider uppercase transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </button>
          )}
        </div>
      </aside>

      {/* ================= SIDEBAR DRAWER (MOBILE) ================= */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/60 backdrop-blur-none">
          <div className="w-64 bg-[#0f2c59] text-white flex flex-col h-full shadow-2xl relative">
            {/* Header */}
            <div className="h-16 flex items-center px-4 border-b border-[#1b3b6f] justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#0a1e3f] text-white border border-[#264978]">
                  <ShieldCheck className="h-5 w-5 text-sky-400" />
                </div>
                <span className="font-bold text-sm tracking-wider uppercase text-white">SIM-RIDA</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="text-slate-300 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu */}
            <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
              {navLinks.map((link) => {
                const isActive = pathname === link.path || pathname.startsWith(link.path + '/');

                return (
                  <Link
                    key={link.name}
                    href={link.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-xs font-semibold tracking-wider uppercase transition-colors',
                      isActive
                        ? 'bg-[#1b3b6f] text-white border-l-4 border-l-sky-400 font-bold'
                        : 'text-slate-300 hover:bg-[#15325b] hover:text-white border-l-4 border-l-transparent'
                    )}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-[#1b3b6f] p-4 bg-[#0a1e3f]">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 bg-[#1b3b6f] border border-[#264978] flex items-center justify-center text-xs font-bold text-sky-300 uppercase shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-white truncate leading-none mb-1">
                    {currentUser.name}
                  </p>
                  <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                    {ROLE_LABELS[currentUser.role] || currentUser.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 border border-[#264978] hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 text-xs font-semibold tracking-wider uppercase transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar Aplikasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN COLUMN ================= */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ================= TOPBAR ================= */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-20">

          {/* Left Section: Mobile Menu & Breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Link href="/dashboard" className="hover:text-[#0f2c59] transition-colors">
                SIM-RIDA
              </Link>
              {breadcrumbs.map((crumb) => (
                <React.Fragment key={crumb.path}>
                  <span>/</span>
                  {crumb.isLast ? (
                    <span className="text-[#0f2c59] font-bold">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.path} className="hover:text-[#0f2c59] transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
            <span className="sm:hidden text-sm font-bold text-[#0f2c59]">
              {pageTitle}
            </span>
          </div>

          {/* Right Section: Role Switcher & Notif Bell & User Profile Dropdown */}
          <div className="flex items-center gap-3">

            {/* Authenticated User Role Badge */}
            <div className="flex items-center gap-1.5 border border-slate-300 bg-slate-50 px-2.5 py-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hidden sm:inline">Role:</span>
              <span className="text-xs font-bold text-[#0f2c59]">
                {ROLE_LABELS[currentUser.role] || currentUser.role}
              </span>
              {currentUser.opd?.code && (
                <span className="text-[10px] px-1.5 py-0.2 bg-[#0f2c59] text-white font-mono uppercase font-bold rounded-sm ml-1 hidden md:inline">
                  {currentUser.opd.code}
                </span>
              )}
            </div>

            {/* Notification Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsProfileOpen(false);
                }}
                className={cn(
                  'p-2 border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors relative'
                )}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-3.5 w-3.5 bg-rose-600 text-[8px] font-bold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 mt-1 w-80 bg-white border border-slate-300 shadow-xl py-0 z-50 text-xs">
                    <div className="px-4 py-2.5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                      <span className="font-bold uppercase tracking-wider text-slate-800 text-xs">Notifikasi Sistem</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] text-[#0f2c59] font-bold uppercase hover:underline"
                        >
                          Tandai Semua Dibaca
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-xs">
                          Tidak ada notifikasi baru saat ini.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={cn(
                              'p-3 space-y-1 hover:bg-slate-50 transition-colors',
                              !notif.isRead && 'bg-blue-50/40 font-medium'
                            )}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-900">{notif.title}</span>
                              <span className="text-[9px] text-slate-400">{notif.time}</span>
                            </div>
                            <p className="text-slate-600 text-xs leading-relaxed">
                              {notif.description}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <div className="h-6 w-6 bg-[#0f2c59] text-xs font-bold text-white flex items-center justify-center uppercase shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <p className="text-xs font-bold text-slate-900 leading-none mb-0.5">
                    {currentUser.name}
                  </p>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {ROLE_LABELS[currentUser.role] || currentUser.role}
                  </span>
                </div>
              </button>

              {/* Profile Dropdown Popover */}
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-300 shadow-xl py-0 z-50 text-xs text-slate-800">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                      <p className="font-bold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        alert('Halaman Profil Pengguna.');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100"
                    >
                      <UserIcon className="h-4 w-4 text-slate-500" />
                      <span>Profil Pengguna</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-semibold"
                    >
                      <LogOut className="h-4 w-4 text-rose-600" />
                      <span>Keluar Aplikasi</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

        </header>

        {/* ================= PAGE CONTENT ================= */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
