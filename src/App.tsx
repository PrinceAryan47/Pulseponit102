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

// Pages (to be created)
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Appointments = React.lazy(() => import('./pages/Appointments'));
const HealthTools = React.lazy(() => import('./pages/HealthTools'));
const Hospitals = React.lazy(() => import('./pages/Hospitals'));
const Doctors = React.lazy(() => import('./pages/Doctors'));
const MedicalRecords = React.lazy(() => import('./pages/MedicalRecords'));
const Prescriptions = React.lazy(() => import('./pages/Prescriptions'));
const Articles = React.lazy(() => import('./pages/Articles'));
const ArticleDetail = React.lazy(() => import('./pages/ArticleDetail'));
const CreateArticle = React.lazy(() => import('./pages/CreateArticle'));
const EditArticle = React.lazy(() => import('./pages/EditArticle'));
const Profile = React.lazy(() => import('./pages/Profile'));
const FirstAid = React.lazy(() => import('./pages/FirstAid'));
const DoctorDashboard = React.lazy(() => import('./pages/DoctorDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

const Chat = React.lazy(() => import('./pages/Chat'));
const Meeting = React.lazy(() => import('./pages/Meeting'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const admins = ["mafialord1247@gmail.com", "mafia.lord1247@gmail.com", "prince47aryan@gmail.com"];
  
  if (loading) return <LoadingScreen />;
  if (!user || !admins.includes(user.email || '')) return <Navigate to="/" />;
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
