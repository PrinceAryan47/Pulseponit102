import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import { UserStatusManager } from './components/UserStatusManager';
import CallManager from './components/CallManager';
import { initializeSettings } from './services/settingsService';

// Resilient lazy loader that retries on network drops or stale Vite dev chunks
const lazyWithRetry = <T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) =>
  React.lazy(async () => {
    try {
      return await factory();
    } catch (error: any) {
      console.warn("Dynamic module import failed, attempting retry...", error);
      await new Promise((res) => setTimeout(res, 350));
      try {
        return await factory();
      } catch (retryError: any) {
        console.error("Secondary dynamic module load failed:", retryError);
        const key = "pulsepoint_lazy_retry_" + (typeof window !== "undefined" ? window.location.pathname : "");
        const alreadyTried = window.sessionStorage?.getItem(key);
        if (!alreadyTried && typeof window !== "undefined") {
          window.sessionStorage?.setItem(key, "true");
          window.location.reload();
          return { default: (() => null) as unknown as T };
        }
        throw retryError;
      }
    }
  });

// Pages
const Home = lazyWithRetry(() => import('./pages/Home'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const Register = lazyWithRetry(() => import('./pages/Register'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const Appointments = lazyWithRetry(() => import('./pages/Appointments'));
const HealthTools = lazyWithRetry(() => import('./pages/HealthTools'));
const Hospitals = lazyWithRetry(() => import('./pages/Hospitals'));
const Doctors = lazyWithRetry(() => import('./pages/Doctors'));
const MedicalRecords = lazyWithRetry(() => import('./pages/MedicalRecords'));
const Prescriptions = lazyWithRetry(() => import('./pages/Prescriptions'));
const Articles = lazyWithRetry(() => import('./pages/Articles'));
const ArticleDetail = lazyWithRetry(() => import('./pages/ArticleDetail'));
const CreateArticle = lazyWithRetry(() => import('./pages/CreateArticle'));
const EditArticle = lazyWithRetry(() => import('./pages/EditArticle'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const FirstAid = lazyWithRetry(() => import('./pages/FirstAid'));
const DoctorDashboard = lazyWithRetry(() => import('./pages/DoctorDashboard'));
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const Messages = lazyWithRetry(() => import('./pages/Messages'));
const Chat = lazyWithRetry(() => import('./pages/Chat'));
const Meeting = lazyWithRetry(() => import('./pages/Meeting'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isSuperAdmin } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!user || !isSuperAdmin) return <Navigate to="/" />;
  return <>{children}</>;
};

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
    <div className="w-16 h-16 border-4 border-neon-blue/20 border-t-neon-blue rounded-full animate-spin mb-4"></div>
    <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">PulsePoint</p>
  </div>
);

export default function App() {
  React.useEffect(() => {
    initializeSettings();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <UserStatusManager />
            <Router>
            <CallManager />
            <React.Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="health-tools" element={<HealthTools />} />
                  <Route path="hospitals" element={<Hospitals />} />
                  <Route path="doctors" element={<Doctors />} />
                  <Route path="first-aid" element={<FirstAid />} />
                  <Route path="articles" element={<Articles />} />
                  <Route path="articles/:id" element={<ArticleDetail />} />
                  <Route path="articles/create" element={
                    <ProtectedRoute>
                      <CreateArticle />
                    </ProtectedRoute>
                  } />
                  <Route path="articles/:id/edit" element={
                    <ProtectedRoute>
                      <EditArticle />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="doctor-dashboard" element={
                    <ProtectedRoute>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="admin" element={
                    <SuperAdminRoute>
                      <AdminDashboard />
                    </SuperAdminRoute>
                  } />
                  <Route path="appointments" element={
                    <ProtectedRoute>
                      <Appointments />
                    </ProtectedRoute>
                  } />
                  <Route path="medical-records" element={
                    <ProtectedRoute>
                      <MedicalRecords />
                    </ProtectedRoute>
                  } />
                  <Route path="prescriptions" element={
                    <ProtectedRoute>
                      <Prescriptions />
                    </ProtectedRoute>
                  } />
                  <Route path="messages" element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  } />
                  <Route path="profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="chat/:roomId" element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  } />
                  <Route path="meeting/:roomId" element={
                    <ProtectedRoute>
                      <Meeting />
                    </ProtectedRoute>
                  } />
                </Route>
              </Routes>
            </React.Suspense>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
  );
}
