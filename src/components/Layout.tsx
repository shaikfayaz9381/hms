import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  FileText,
  Pill,
  Bed,
  CreditCard,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Activity,
  Menu,
  X,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface LayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentTab, onTabChange, children }) => {
  const { user, logout, switchDemoRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const getRoleNavItems = (role?: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'patients', label: 'Patients', icon: Users },
          { id: 'doctors', label: 'Doctors & Depts', icon: UserCheck },
          { id: 'appointments', label: 'Appointments', icon: Calendar },
          { id: 'records', label: 'Medical Records', icon: FileText },
          { id: 'prescriptions', label: 'Pharmacy & Rx', icon: Pill },
          { id: 'rooms', label: 'Room Management', icon: Bed },
          { id: 'billing', label: 'Simulated Billing', icon: CreditCard },
          { id: 'audit', label: 'System Audit Logs', icon: ShieldCheck },
        ];
      case 'DOCTOR':
        return [
          { id: 'dashboard', label: 'Clinical Dashboard', icon: LayoutDashboard },
          { id: 'patients', label: 'Patient Directory', icon: Users },
          { id: 'appointments', label: 'My Appointments', icon: Calendar },
          { id: 'records', label: 'Clinical Records', icon: FileText },
          { id: 'prescriptions', label: 'Digital Prescriptions', icon: Pill },
        ];
      case 'RECEPTIONIST':
        return [
          { id: 'dashboard', label: 'Frontdesk Overview', icon: LayoutDashboard },
          { id: 'patients', label: 'Patient Intake', icon: Users },
          { id: 'appointments', label: 'Booking & Schedule', icon: Calendar },
          { id: 'doctors', label: 'Doctor Availability', icon: UserCheck },
          { id: 'rooms', label: 'Bed & Ward Status', icon: Bed },
          { id: 'billing', label: 'Invoices & Billing', icon: CreditCard },
        ];
      case 'PATIENT':
        return [
          { id: 'dashboard', label: 'My Health Portal', icon: LayoutDashboard },
          { id: 'appointments', label: 'My Consultations', icon: Calendar },
          { id: 'records', label: 'Medical History', icon: FileText },
          { id: 'prescriptions', label: 'My Prescriptions', icon: Pill },
          { id: 'billing', label: 'Billing Statements', icon: CreditCard },
        ];
      default:
        return [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }];
    }
  };

  const navItems = getRoleNavItems(user?.role);

  const demoRoles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'ADMIN', label: 'System Administrator', desc: 'Full access to all 10 modules & audit logs' },
    { role: 'DOCTOR', label: 'Attending Doctor', desc: 'Consultations, diagnoses, prescriptions' },
    { role: 'RECEPTIONIST', label: 'Front Desk Reception', desc: 'Patient intake, scheduling, billing' },
    { role: 'PATIENT', label: 'Rahul Verma (Patient)', desc: 'Personal records, prescriptions, invoices' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Main Top Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-md"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">MedPulse</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Hospital Clinical System</span>
            </div>
          </div>
        </div>

        {/* Center / Right: Demo Role Switcher & User Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Role:</span>
              <span className="font-semibold text-slate-900">{user?.role}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100 text-slate-500 font-medium">
                  Switch Demo Account (1-Click)
                </div>
                {demoRoles.map(item => (
                  <button
                    key={item.role}
                    onClick={() => {
                      switchDemoRole(item.role);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 cursor-pointer ${
                      user?.role === item.role ? 'bg-teal-50 text-teal-900' : 'text-slate-700'
                    }`}
                  >
                    <div className="font-semibold flex items-center justify-between">
                      <span>{item.label}</span>
                      {user?.role === item.role && (
                        <span className="text-[10px] text-teal-700 bg-teal-100 px-1.5 py-0.2 rounded font-mono">ACTIVE</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-slate-900 block leading-tight">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{user?.email}</span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 p-4 shrink-0">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
            Navigation Menu
          </div>

          <nav className="space-y-1 flex-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-teal-50 text-teal-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer Info */}
          <div className="pt-4 mt-auto border-t border-slate-100 text-[11px] text-slate-400">
            <p className="font-semibold text-slate-600">MedPulse Clinical System v1.0</p>
            <p>Secure clinical workspace</p>
            <p className="text-[10px] text-slate-400 mt-1">Authorized personnel only</p>
          </div>
        </aside>

        {/* Mobile Sidebar Modal */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-64 bg-white h-full p-4 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-900">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <nav className="space-y-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                        isActive ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Dynamic Viewport View */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
