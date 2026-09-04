'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Database,
  Layers,
  Users,
  Settings,
  Search,
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
  HelpCircle,
  FileStack,
  BookOpen
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils/cn';

// Route restriction rules
const ALLOWED_ROUTES: Record<string, string[]> = {
  ADMIN_BRIDA: ['/dashboard', '/knowledge-base', '/research-proposals', '/research', '/implementation', '/recommendations', '/master-data', '/users', '/settings'],
  BRIDA: ['/dashboard', '/knowledge-base', '/identification', '/research-proposals', '/research', '/implementation', '/monitoring', '/reports', '/policy-brief', '/recommendations'],
  KEPALA_BRIDA: ['/dashboard', '/knowledge-base', '/research-proposals', '/research', '/implementation', '/approvals', '/recommendations', '/reports'],
  OPD: ['/dashboard', '/opd'],
};

// Map roles to readable labels
const ROLE_LABELS: Record<string, string> = {
  ADMIN_BRIDA: 'Admin BRIDA',
  BRIDA: 'BRIDA Litbang',
  KEPALA_BRIDA: 'Kepala BRIDA',
  OPD: 'Dinas Daerah (OPD)',
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
      // Normalize pathname by removing trailing slashes or subpaths if any
      const baseRoute = pathname.split('/').slice(0, 2).join('/');
      
      if (!allowed.includes(baseRoute)) {
        router.replace('/unauthorized');
      }
    }
  }, [mounted, isAuthenticated, currentUser, pathname, router]);

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wider">Memuat Sesi...</span>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
          { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { 
            name: 'Knowledge Base', 
            path: '/knowledge-base', 
            icon: <BookOpen className="h-4 w-4" />,
            sublinks: [
              { name: 'Daftar Dokumen', path: '/knowledge-base' },
              { name: 'Kategori Dokumen', path: '/knowledge-base/categories' },
              { name: 'Riwayat Pembaruan', path: '/knowledge-base/update-history' },
            ]
          },
          { name: 'Usulan Penelitian', path: '/research-proposals', icon: <FileText className="h-4 w-4" /> },
          { name: 'Penelitian', path: '/research', icon: <FileStack className="h-4 w-4" /> },
          { name: 'Pelaksanaan', path: '/implementation', icon: <ClipboardList className="h-4 w-4" /> },
          { name: 'Rekomendasi', path: '/recommendations', icon: <Award className="h-4 w-4" /> },
          { name: 'Master Data', path: '/master-data', icon: <Layers className="h-4 w-4" /> },
          { name: 'User Management', path: '/users', icon: <Users className="h-4 w-4" /> },
          { name: 'System Settings', path: '/settings', icon: <Settings className="h-4 w-4" /> },
        ];
      case 'BRIDA':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { name: 'Knowledge Base', path: '/knowledge-base', icon: <BookOpen className="h-4 w-4" /> },
          { name: 'Identifikasi Kebutuhan', path: '/identification', icon: <Search className="h-4 w-4" /> },
          { name: 'Usulan Penelitian', path: '/research-proposals', icon: <FileText className="h-4 w-4" /> },
          { name: 'Penelitian', path: '/research', icon: <FileStack className="h-4 w-4" /> },
          { name: 'Pelaksanaan', path: '/implementation', icon: <ClipboardList className="h-4 w-4" /> },
          { name: 'Monitoring', path: '/monitoring', icon: <Activity className="h-4 w-4" /> },
          { name: 'Laporan', path: '/reports', icon: <FileText className="h-4 w-4" /> },
          { name: 'Policy Brief', path: '/policy-brief', icon: <ShieldCheck className="h-4 w-4" /> },
          { name: 'Rekomendasi', path: '/recommendations', icon: <Award className="h-4 w-4" /> },
        ];
      case 'KEPALA_BRIDA':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { name: 'Persetujuan', path: '/approvals', icon: <ClipboardCheck className="h-4 w-4" /> },
          { name: 'Usulan Penelitian', path: '/research-proposals', icon: <FileText className="h-4 w-4" /> },
          { name: 'Penelitian', path: '/research', icon: <FileStack className="h-4 w-4" /> },
          { name: 'Pelaksanaan', path: '/implementation', icon: <ClipboardList className="h-4 w-4" /> },
          { name: 'Rekomendasi', path: '/recommendations', icon: <Award className="h-4 w-4" /> },
          { name: 'Laporan', path: '/reports', icon: <FileText className="h-4 w-4" /> },
        ];
      case 'OPD':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { name: 'Rekomendasi Masuk', path: '/opd/recommendations', icon: <Award className="h-4 w-4" /> },
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
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-250">
      
      {/* ================= SIDEBAR (DESKTOP) ================= */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-950 transition-all duration-300 relative shrink-0",
          isSidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-850 justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1.5 bg-blue-600 text-white rounded shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-white leading-none">SIM-RIDA</span>
                <span className="text-[9px] text-gray-400 font-semibold leading-none mt-1">Sistem Riset Daerah</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.path || pathname.startsWith(link.path + '/');
            const hasSublinks = !!link.sublinks;
            
            return (
              <div key={link.name} className="space-y-1">
                {hasSublinks ? (
                  <>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded text-gray-550 dark:text-gray-400 select-none"
                      )}
                    >
                      <span className="shrink-0 text-gray-400">{link.icon}</span>
                      {!isSidebarCollapsed && <span className="truncate">{link.name}</span>}
                    </div>
                    {!isSidebarCollapsed && (
                      <div className="pl-7 space-y-1 border-l border-gray-100 dark:border-gray-800 ml-5">
                        {link.sublinks?.map((sub) => {
                          const isSubActive = pathname === sub.path;
                          return (
                            <Link
                              key={sub.name}
                              href={sub.path}
                              className={cn(
                                "block px-3 py-1.5 text-[11px] font-medium rounded transition-colors",
                                isSubActive
                                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold"
                                  : "text-gray-500 hover:text-gray-900 dark:text-gray-450 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900/50"
                              )}
                            >
                              {sub.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={link.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded transition-colors group",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-450 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white"
                    )}
                    title={isSidebarCollapsed ? link.name : undefined}
                  >
                    <span className="shrink-0">{link.icon}</span>
                    {!isSidebarCollapsed && <span className="truncate">{link.name}</span>}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute top-20 -right-3 h-6 w-6 rounded-full bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600 z-30 shadow-sm"
        >
          {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Sidebar Footer User Card */}
        <div className="border-t border-gray-200 dark:border-gray-850 p-3 bg-gray-50/50 dark:bg-gray-950/20">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate leading-none mb-1">
                  {currentUser.name}
                </p>
                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400 leading-none">
                  {ROLE_LABELS[currentUser.role] || currentUser.role}
                </span>
              </div>
            )}
          </div>
          {!isSidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-950/10 text-red-650 hover:text-red-700 dark:text-red-405 rounded text-xs font-semibold transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar</span>
            </button>
          )}
        </div>
      </aside>

      {/* ================= SIDEBAR DRAWER (MOBILE) ================= */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-gray-900/40 backdrop-blur-sm">
          <div className="w-64 bg-white dark:bg-gray-950 flex flex-col h-full shadow-2xl relative animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-850 justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 text-white rounded">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-white">SIM-RIDA</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu */}
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
              {navLinks.map((link) => {
                const isActive = pathname === link.path || pathname.startsWith(link.path + '/');
                const hasSublinks = !!link.sublinks;
                
                return (
                  <div key={link.name} className="space-y-1">
                    {hasSublinks ? (
                      <>
                        <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded text-gray-550 dark:text-gray-400">
                          <span className="shrink-0 text-gray-400">{link.icon}</span>
                          <span>{link.name}</span>
                        </div>
                        <div className="pl-7 space-y-1 border-l border-gray-100 dark:border-gray-800 ml-5">
                          {link.sublinks?.map((sub) => {
                            const isSubActive = pathname === sub.path;
                            return (
                              <Link
                                key={sub.name}
                                href={sub.path}
                                onClick={() => setIsMobileOpen(false)}
                                className={cn(
                                  "block px-3 py-2 text-[11px] font-medium rounded transition-colors",
                                  isSubActive
                                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold"
                                    : "text-gray-500 hover:text-gray-900 dark:text-gray-450 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900/50"
                                )}
                              >
                                {sub.name}
                              </Link>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <Link
                        href={link.path}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded transition-colors",
                          isActive
                            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                            : "text-gray-600 dark:text-gray-450 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white"
                        )}
                      >
                        {link.icon}
                        <span>{link.name}</span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-850 p-4 bg-gray-50/50 dark:bg-gray-950/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300 uppercase">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {currentUser.name}
                  </p>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400">
                    {ROLE_LABELS[currentUser.role] || currentUser.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-950/10 text-red-650 hover:text-red-700 dark:text-red-405 rounded text-xs font-semibold transition-colors"
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
        <header className="h-16 border-b border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-950 flex items-center justify-between px-4 sticky top-0 z-40">
          
          {/* Left Section: Mobile Menu & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-1.5 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold text-gray-400">
              <Link href="/dashboard" className="hover:text-gray-650 dark:hover:text-white transition-colors">
                SIM-RIDA
              </Link>
              {breadcrumbs.map((crumb) => (
                <React.Fragment key={crumb.path}>
                  <span>/</span>
                  {crumb.isLast ? (
                    <span className="text-gray-800 dark:text-gray-300 font-bold">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.path} className="hover:text-gray-650 dark:hover:text-white transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
            <span className="sm:hidden text-sm font-bold text-gray-905 dark:text-white">
              {pageTitle}
            </span>
          </div>

          {/* Right Section: Notif Bell & User Profile Dropdown */}
          <div className="flex items-center gap-3">
            
            {/* Notification Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsProfileOpen(false);
                }}
                className={cn(
                  "p-1.5 border border-gray-200 dark:border-gray-800 rounded-full text-gray-500 hover:text-gray-750 dark:text-gray-450 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors relative"
                )}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center transform translate-x-1/3 -translate-y-1/3">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-850 rounded-lg shadow-xl py-1 z-50 animate-in fade-in duration-100 text-xs">
                    <div className="px-4 py-2 border-b border-gray-150 dark:border-gray-850 flex justify-between items-center bg-gray-50/50 dark:bg-gray-950/20">
                      <span className="font-bold text-gray-850 dark:text-white">Notifikasi</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                        >
                          Tandai baca semua
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-850">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            "p-3 space-y-1 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors",
                            !notif.isRead && "bg-blue-50/30 dark:bg-blue-950/10 font-medium"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-gray-900 dark:text-white">{notif.title}</span>
                            <span className="text-[9px] text-gray-400">{notif.time}</span>
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 text-3xs leading-relaxed">
                            {notif.description}
                          </p>
                        </div>
                      ))}
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
                className="flex items-center gap-2 p-1 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-750 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-all"
              >
                <div className="h-6 w-6 rounded bg-blue-100 dark:bg-blue-950 text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center justify-center uppercase shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left pr-1.5">
                  <p className="text-[11px] font-bold text-gray-900 dark:text-white leading-none mb-0.5">
                    {currentUser.name}
                  </p>
                  <span className="text-[9px] text-gray-400 leading-none">
                    {ROLE_LABELS[currentUser.role] || currentUser.role}
                  </span>
                </div>
              </button>

              {/* Profile Dropdown Popover */}
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-850 rounded-lg shadow-xl py-1 z-50 animate-in fade-in duration-100 text-xs text-gray-700 dark:text-gray-300">
                    <div className="px-4 py-2.5 border-b border-gray-150 dark:border-gray-850">
                      <p className="font-bold text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{currentUser.email}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        alert('Halaman Profil sedang dikonstruksi.');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center gap-2"
                    >
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span>Profil Pengguna</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        alert('Halaman Pengaturan sedang dikonstruksi.');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center gap-2 border-b border-gray-100 dark:border-gray-850"
                    >
                      <Settings className="h-4 w-4 text-gray-400" />
                      <span>Pengaturan</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/10 flex items-center gap-2 font-semibold"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      <span>Keluar Aplikasi</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

        </header>

        {/* ================= PAGE CONTENT ================= */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
