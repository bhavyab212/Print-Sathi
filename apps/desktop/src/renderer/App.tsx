import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { NavigationProvider } from './components/navigation/NavigationProvider';

// Layouts
import { AppShell } from './components/layout/AppShell';

// Views
import LoginView from './views/LoginView';
import OnboardingView from './views/OnboardingView';
import QueueDashboardView from './views/QueueDashboardView';
import PassportPhotoView from './views/PassportPhotoView';
import BgRemoveView from './views/BgRemoveView';
import BillCalculatorView from './views/BillCalculatorView';
import FixPrintView from './views/FixPrintView';
import SettingsView from './views/settings/SettingsView';
import PrinterSettingsView from './views/settings/PrinterSettingsView';
import ShopSettingsView from './views/settings/ShopSettingsView';
import RateCardSettingsView from './views/settings/RateCardSettingsView';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading, isInitialized } = useAuthStore();

  if (!isInitialized || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <i className="bx bx-loader-alt animate-spin text-4xl text-blue-500"></i>
          <p className="text-gray-500">Starting Print Sathi...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function ShopRequiredRoute({ children }: { children: React.ReactNode }) {
  const { shop, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <i className="bx bx-loader-alt animate-spin text-4xl text-blue-500"></i>
          <p className="text-gray-500">Loading shop data...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <HashRouter>
      <NavigationProvider>
        <Routes>
        <Route path="/login" element={<LoginView />} />
        
        <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
          <Route path="/onboarding" element={<OnboardingView />} />
          
          <Route element={<ShopRequiredRoute><AppShell><Outlet /></AppShell></ShopRequiredRoute>}>
            <Route path="/" element={<Navigate to="/queue" replace />} />
            <Route path="/queue" element={<QueueDashboardView />} />
            <Route path="/passport" element={<PassportPhotoView />} />
            <Route path="/bg-remove" element={<BgRemoveView />} />
            <Route path="/billing" element={<BillCalculatorView />} />
            <Route path="/fix-print" element={<FixPrintView />} />
            
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/settings/printers" element={<PrinterSettingsView />} />
            <Route path="/settings/shop" element={<ShopSettingsView />} />
            <Route path="/settings/ratecard" element={<RateCardSettingsView />} />
          </Route>
        </Route>
      </Routes>
      </NavigationProvider>
    </HashRouter>
  );
}
