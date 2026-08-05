import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { Role } from '../lib/types';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Users, Calendar, Upload, Trash2,
  Building2, FileText, BarChart2, Shield, Heart,
  UserCheck, Activity, ClipboardCheck, UserCircle,
  Baby, AlertCircle, Eye, LogOut, Menu, X,
  Clock, CalendarCheck,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: LucideIcon;
  to: string;
}

const navByRole: Record<Role, NavItem[]> = {
  admin: [
    { label: 'Dashboard',         icon: LayoutDashboard, to: '/admin/dashboard' },
    { label: 'User Management',   icon: Users,           to: '/admin/users' },
    { label: 'HAF Cycles',        icon: Calendar,        to: '/admin/cycles' },
    { label: 'Bulk Uploads',      icon: Upload,          to: '/admin/bulk-uploads' },
    { label: 'Deletion Requests', icon: Trash2,          to: '/admin/deletion-requests' },
    { label: 'Club Settings',     icon: Building2,       to: '/admin/club-settings' },
    { label: 'System Logs',       icon: FileText,        to: '/admin/logs' },
    { label: 'Reports',           icon: BarChart2,       to: '/admin/reports' },
  ],
  council: [
    { label: 'Dashboard',  icon: LayoutDashboard, to: '/council/dashboard' },
    { label: 'Monitoring', icon: Eye,             to: '/council/monitoring' },
    { label: 'Reports',    icon: BarChart2,       to: '/council/reports' },
  ],
  club: [
    { label: 'Dashboard',        icon: LayoutDashboard, to: '/club/dashboard' },
    { label: 'Club Profile',     icon: Building2,       to: '/club/profile' },
    { label: 'Activities',       icon: Activity,        to: '/club/activities' },
    { label: 'Attendance',       icon: ClipboardCheck,  to: '/club/attendance' },
    { label: 'Participation',    icon: CalendarCheck,   to: '/club/participation' },
    { label: 'FSM Checks',       icon: Shield,          to: '/club/fsm' },
    { label: 'Parents & Children', icon: Users,         to: '/club/parents' },
    { label: 'Reports',          icon: BarChart2,       to: '/club/reports' },
  ],
  parent: [
    { label: 'Dashboard',       icon: LayoutDashboard, to: '/parent/dashboard' },
    { label: 'My Profile',      icon: UserCircle,      to: '/parent/profile' },
    { label: 'Children',        icon: Baby,            to: '/parent/children' },
    { label: 'Carers',          icon: UserCheck,       to: '/parent/carers' },
    { label: 'Activities',      icon: Activity,        to: '/parent/activities' },
    { label: 'Deletion Request', icon: AlertCircle,    to: '/parent/deletion-request' },
  ],
};

const roleConfig: Record<Role, { label: string; color: string; bg: string }> = {
  admin:   { label: 'Administrator',    color: 'text-red-300',    bg: 'bg-red-900/40' },
  council: { label: 'Council User',     color: 'text-blue-300',   bg: 'bg-blue-900/40' },
  club:    { label: 'Club Operator',    color: 'text-emerald-300', bg: 'bg-emerald-900/40' },
  parent:  { label: 'Parent/Guardian', color: 'text-amber-300',  bg: 'bg-amber-900/40' },
};

function SessionWarningModal({ onContinue, onLogout }: { onContinue: () => void; onLogout: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
        <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center text-warning-600 mb-4 mx-auto">
          <Clock size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-900 text-center mb-2">Session expiring soon</h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Your session will expire in 5 minutes due to inactivity. Would you like to continue?
        </p>
        <div className="flex gap-3">
          <button onClick={onLogout} className="btn-secondary flex-1">Sign out</button>
          <button onClick={onContinue} className="btn-primary flex-1">Continue session</button>
        </div>
      </div>
    </div>
  );
}

export function Layout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = auth.user;
  if (!user) return null;

  const navItems = navByRole[user.role] ?? [];
  const role = roleConfig[user.role];
  const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = () => {
    auth.logout();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
          <Heart size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate leading-tight">Bradford HAF</p>
          <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider">Holiday Activities & Food</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-4 pb-2">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${role.bg} ${role.color}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
          {role.label}
        </span>
      </div>

      {/* Nav */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <Icon size={17} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-800/80 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800/50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Accessibility: skip to main content */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 sticky top-0 h-screen shadow-sidebar">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] shadow-2xl animate-slide-in-left">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 z-10"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-md bg-primary-600 flex items-center justify-center">
              <Heart size={14} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">Bradford HAF</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Session warning modal */}
      {auth.sessionWarning && (
        <SessionWarningModal
          onContinue={() => auth.extendSession()}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
