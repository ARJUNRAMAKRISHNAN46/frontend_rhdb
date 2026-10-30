import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { ActiveSection } from '@/types/pharmacy';
import { ThemeProvider } from '@/context/ThemeContext';
import { PharmacyShell } from '@/components/layout/PharmacyShell';

import { DashboardView } from '@/features/dashboard/DashboardView';
import { PrescriptionsView } from '@/features/prescriptions/PrescriptionsView';
import { MedicineVerificationView } from '@/features/medicine-verification/MedicineVerificationView';
import { InventoryView } from '@/features/inventory/InventoryView';
import { DispensingHistoryView } from '@/features/dispensing-history/DispensingHistoryView';
import { ReportsView } from '@/features/reports/ReportsView';

// Reusable navigation helper hook for views
function useViewNavigator() {
  const navigate = useNavigate();
  return (section: ActiveSection, contextId?: string) => {
    if (contextId) {
      navigate(`/${section}?id=${encodeURIComponent(contextId)}`);
    } else {
      navigate(`/${section}`);
    }
  };
}

function DashboardRoute() {
  const onNavigate = useViewNavigator();
  return <DashboardView onNavigate={onNavigate} />;
}

function PrescriptionsRoute() {
  const onNavigate = useViewNavigator();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const selectedId = id || searchParams.get('id') || undefined;

  return <PrescriptionsView onNavigate={onNavigate} selectedId={selectedId} />;
}

function MedicineVerificationRoute() {
  const onNavigate = useViewNavigator();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const selectedId = id || searchParams.get('id') || undefined;

  return <MedicineVerificationView onNavigate={onNavigate} selectedId={selectedId} />;
}

function InventoryRoute() {
  const onNavigate = useViewNavigator();
  return <InventoryView onNavigate={onNavigate} />;
}

function DispensingHistoryRoute() {
  const onNavigate = useViewNavigator();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const selectedId = id || searchParams.get('id') || undefined;

  return <DispensingHistoryView onNavigate={onNavigate} selectedId={selectedId} />;
}

function ReportsRoute() {
  const onNavigate = useViewNavigator();
  return <ReportsView onNavigate={onNavigate} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <PharmacyShell>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardRoute />} />
            <Route path="/prescriptions" element={<PrescriptionsRoute />} />
            <Route path="/prescriptions/:id" element={<PrescriptionsRoute />} />
            <Route path="/medicine-verification" element={<MedicineVerificationRoute />} />
            <Route path="/medicine-verification/:id" element={<MedicineVerificationRoute />} />
            <Route path="/inventory" element={<InventoryRoute />} />
            <Route path="/dispensing-history" element={<DispensingHistoryRoute />} />
            <Route path="/dispensing-history/:id" element={<DispensingHistoryRoute />} />
            <Route path="/reports" element={<ReportsRoute />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </PharmacyShell>
      </BrowserRouter>
    </ThemeProvider>
  );
}
