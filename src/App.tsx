import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { PatientsView } from './views/PatientsView';
import { DoctorsView } from './views/DoctorsView';
import { AppointmentsView } from './views/AppointmentsView';
import { MedicalRecordsView } from './views/MedicalRecordsView';
import { PrescriptionsView } from './views/PrescriptionsView';
import { RoomsView } from './views/RoomsView';
import { BillingView } from './views/BillingView';
import { AuditLogsView } from './views/AuditLogsView';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-600">Initializing MedPulse Clinical System...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentTab} />;
      case 'patients':
        return <PatientsView />;
      case 'doctors':
        return <DoctorsView />;
      case 'appointments':
        return <AppointmentsView />;
      case 'records':
        return <MedicalRecordsView />;
      case 'prescriptions':
        return <PrescriptionsView />;
      case 'rooms':
        return <RoomsView />;
      case 'billing':
        return <BillingView />;
      case 'audit':
        return <AuditLogsView />;
      default:
        return <DashboardView onNavigate={setCurrentTab} />;
    }
  };

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
      {renderActiveView()}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
