import { type ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider } from './lib/store';
import { AuthProvider, useAuth } from './lib/auth';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { CookieBanner } from './components/CookieBanner';
import {
  AdminDashboard, AdminUsers, AdminCycles, AdminBulkUploads,
  AdminDeletionRequests, AdminClubSettings, AdminLogs, AdminReports,
} from './pages/admin/AdminPages';
import { CouncilDashboard, CouncilMonitoring, CouncilReports } from './pages/council/CouncilPages';
import {
  ClubDashboard, ClubProfile, ClubActivities, ClubAttendance,
  ClubParticipation, ClubFsm, ClubParents, ClubReports,
} from './pages/club/ClubPages';
import {
  ParentDashboard, ParentProfile, ParentChildren,
  ParentCarers, ParentActivities, ParentDeletionRequest,
} from './pages/parent/ParentPages';

function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();

  // Don't redirect while we're still checking localStorage / calling /api/auth/me
  if (auth.initialising) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 text-slate-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm font-medium">Loading…</span>
        </div>
      </div>
    );
  }

  if (!auth.user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function RoleRedirect() {
  const auth = useAuth();
  if (!auth.user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${auth.user.role}/dashboard`} replace />;
}

function AppRoutes() {
  const auth = useAuth();

  return (
    <>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={
            auth.initialising ? null
            : auth.user ? <Navigate to={`/${auth.user.role}/dashboard`} replace />
            : <LoginPage />
          }
        />

        {/* Authenticated — shared Layout with Outlet */}
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          {/* Root → role dashboard */}
          <Route index element={<RoleRedirect />} />

          {/* Admin */}
          <Route path="/admin/dashboard"         element={<AdminDashboard />} />
          <Route path="/admin/users"             element={<AdminUsers />} />
          <Route path="/admin/cycles"            element={<AdminCycles />} />
          <Route path="/admin/bulk-uploads"      element={<AdminBulkUploads />} />
          <Route path="/admin/deletion-requests" element={<AdminDeletionRequests />} />
          <Route path="/admin/club-settings"     element={<AdminClubSettings />} />
          <Route path="/admin/logs"              element={<AdminLogs />} />
          <Route path="/admin/reports"           element={<AdminReports />} />
          <Route path="/admin"                   element={<Navigate to="/admin/dashboard" replace />} />

          {/* Council */}
          <Route path="/council/dashboard"   element={<CouncilDashboard />} />
          <Route path="/council/monitoring"  element={<CouncilMonitoring />} />
          <Route path="/council/reports"     element={<CouncilReports />} />
          <Route path="/council"             element={<Navigate to="/council/dashboard" replace />} />

          {/* Club */}
          <Route path="/club/dashboard"     element={<ClubDashboard />} />
          <Route path="/club/profile"       element={<ClubProfile />} />
          <Route path="/club/activities"    element={<ClubActivities />} />
          <Route path="/club/attendance"    element={<ClubAttendance />} />
          <Route path="/club/participation" element={<ClubParticipation />} />
          <Route path="/club/fsm"           element={<ClubFsm />} />
          <Route path="/club/parents"       element={<ClubParents />} />
          <Route path="/club/reports"       element={<ClubReports />} />
          <Route path="/club"               element={<Navigate to="/club/dashboard" replace />} />

          {/* Parent */}
          <Route path="/parent/dashboard"        element={<ParentDashboard />} />
          <Route path="/parent/profile"          element={<ParentProfile />} />
          <Route path="/parent/children"         element={<ParentChildren />} />
          <Route path="/parent/carers"           element={<ParentCarers />} />
          <Route path="/parent/activities"       element={<ParentActivities />} />
          <Route path="/parent/deletion-request" element={<ParentDeletionRequest />} />
          <Route path="/parent"                  element={<Navigate to="/parent/dashboard" replace />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <CookieBanner />
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </StoreProvider>
  );
}
