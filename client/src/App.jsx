import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layouts
import MainLayout from './layouts/MainLayout';

// Public Pages (Lazy Loaded)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

// Student Pages (Lazy Loaded)
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const ExamDiscoveryPage = lazy(() => import('./pages/student/ExamDiscoveryPage'));
const ExamInstructionsPage = lazy(() => import('./pages/student/ExamInstructionsPage'));
const SystemCheckPage = lazy(() => import('./pages/student/SystemCheckPage'));
const ExamInterfacePage = lazy(() => import('./pages/student/ExamInterfacePage'));
const ExamResultPage = lazy(() => import('./pages/student/ExamResultPage'));
const PracticePage = lazy(() => import('./pages/student/PracticePage'));
const StudentProfilePage = lazy(() => import('./pages/student/StudentProfilePage'));
const PerformancePage = lazy(() => import('./pages/student/PerformancePage'));
const StudentSettingsPage = lazy(() => import('./pages/student/StudentSettingsPage'));

// Faculty Pages (Lazy Loaded)
const FacultyDashboard = lazy(() => import('./pages/faculty/FacultyDashboard'));
const FacultyExamsPage = lazy(() => import('./pages/faculty/FacultyExamsPage'));
const FacultyLiveMonitoringPage = lazy(() => import('./pages/faculty/FacultyLiveMonitoringPage'));
const FacultyExamCreatePage = lazy(() => import('./pages/faculty/FacultyExamCreatePage'));
const FacultyQuestionBankPage = lazy(() => import('./pages/faculty/FacultyQuestionBankPage'));
const FacultyResultsPage = lazy(() => import('./pages/faculty/FacultyResultsPage'));
const FacultyAnalyticsPage = lazy(() => import('./pages/faculty/FacultyAnalyticsPage'));
const FacultyStudentsPage = lazy(() => import('./pages/faculty/FacultyStudentsPage'));
const FacultySettingsPage = lazy(() => import('./pages/faculty/FacultySettingsPage'));

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminStudentsPage = lazy(() => import('./pages/admin/AdminStudentsPage'));
const AdminFacultyPage = lazy(() => import('./pages/admin/AdminFacultyPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));

// Placeholder View
import PlaceholderView from './pages/common/PlaceholderView';

// Route Suspense Fallback
function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin h-8 w-8 border-3 border-brand-600 border-t-transparent rounded-full"></div>
        <span className="text-xs font-bold text-slate-500">Loading module...</span>
      </div>
    </div>
  );
}

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin h-8 w-8 border-3 border-brand-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/about" element={<AboutPage />} />

            {/* Standalone Distraction-Free Exam Attempt Route */}
            <Route
              path="/student/exams/:id/attempt"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <ExamInterfacePage />
                </ProtectedRoute>
              }
            />

            {/* Student Protected Portal */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="exams" element={<ExamDiscoveryPage />} />
              <Route path="exams/:id/instructions" element={<ExamInstructionsPage />} />
              <Route path="exams/:id/system-check" element={<SystemCheckPage />} />
              <Route path="exams/:id/result" element={<ExamResultPage />} />
              <Route path="performance" element={<PerformancePage />} />
              <Route path="results" element={<ExamDiscoveryPage />} />
              <Route path="practice" element={<PracticePage />} />
              <Route path="profile" element={<StudentProfilePage />} />
              <Route path="settings" element={<StudentSettingsPage />} />
            </Route>

            {/* Faculty Protected Portal */}
            <Route
              path="/faculty"
              element={
                <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<FacultyDashboard />} />
              <Route path="exams" element={<FacultyExamsPage />} />
              <Route path="exams/create" element={<FacultyExamCreatePage />} />
              <Route path="question-bank" element={<FacultyQuestionBankPage />} />
              <Route path="monitoring" element={<FacultyLiveMonitoringPage />} />
              <Route path="results" element={<FacultyResultsPage />} />
              <Route path="analytics" element={<FacultyAnalyticsPage />} />
              <Route path="students" element={<FacultyStudentsPage />} />
              <Route path="settings" element={<FacultySettingsPage />} />
            </Route>

            {/* Admin Protected Portal */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminDashboard />} />
              <Route path="students" element={<AdminStudentsPage />} />
              <Route path="faculty" element={<AdminFacultyPage />} />
              <Route path="exams" element={<ExamDiscoveryPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
