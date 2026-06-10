import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Mail, Lock, ArrowRight, Chrome, AlertCircle, UserCircle, Stethoscope, Hospital, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const SPECIALIZATIONS = [
  'General Practice',
  'Cardiology',
  'Pediatrics',
  'Dermatology',
  'Neurology',
  'Orthopedics',
  'Oncology',
  'Obstetrics & Gynecology',
  'Surgery',
  'Psychiatry',
  'Ophthalmology',
  'Urology',
  'Endocrinology',
  'Gastroenterology',
  'Nephrology',
  'Pulmonology',
  'Hematology',
  'Infectious Diseases',
  'Rheumatology',
  'Radiology',
  'Anesthesiology',
  'Emergency Medicine',
  'Family Medicine',
  'Internal Medicine',
  'Pathology',
  'Physical Medicine',
  'Preventive Medicine',
  'Medical Genetics',
  'Geriatrics',
  'Sports Medicine',
  'Nutrition',
  'Dentistry',
  'ENT (Otolaryngology)',
  'Immunology',
  'Physiotherapy',
  'Occupational Therapy',
  'Speech Therapy',
  'Clinical Psychology',
  'Nursing',
  'Midwifery'
].sort();

const UGANDA_HOSPITALS = [
  { id: 'ug-1', name: 'Mulago National Referral Hospital' },
  { id: 'ug-2', name: 'Nakasero Hospital' },
  { id: 'ug-3', name: 'Case Medical Centre' },
  { id: 'ug-4', name: 'International Hospital Kampala (IHK)' },
  { id: 'ug-5', name: 'Mengo Hospital' },
  { id: 'ug-6', name: 'Nsambya Hospital' },
  { id: 'ug-7', name: 'Rubaga Hospital' },
  { id: 'ug-8', name: 'Kibuli Hospital' }
];

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [selectedGender, setSelectedGender] = useState<string>('male');
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | null>(null);
  const [doctorData, setDoctorData] = useState({
    licenseNumber: '',
    specialization: '',
    hospitalId: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setError('Domain not authorized. Please add this domain to the "Authorized domains" list in your Firebase Console (Authentication > Settings).');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Sign-in method not enabled. Please enable Email/Password and Google sign-in in your Firebase Console (Authentication > Sign-in method).');
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Check if profile exists, if not create it
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // For other new users, show role selection modal
        setPendingUser(user);
        setShowRoleModal(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setError('Domain not authorized. Please add this domain to the "Authorized domains" list in your Firebase Console (Authentication > Settings).');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled. Please enable it in your Firebase Console (Authentication > Sign-in method).');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    }
  };

  const handleRoleSelect = async (role: 'patient' | 'doctor') => {
    setSelectedRole(role);
    if (role === 'patient') {
      await completeProfile(role);
    }
  };

  const completeProfile = async (role: 'patient' | 'doctor') => {
    if (!pendingUser) return;
    
    try {
      const profileData: any = {
        uid: pendingUser.uid,
        email: pendingUser.email,
        fullName: pendingUser.displayName || 'Anonymous',
        phoneNumber: pendingUser.phoneNumber || '',
        gender: selectedGender,
        role: role,
        status: 'approved',
        createdAt: serverTimestamp(),
        photoURL: pendingUser.photoURL || '',
      };

      if (role === 'doctor') {
        if (!doctorData.licenseNumber || !doctorData.specialization || !doctorData.hospitalId) {
          setError('Please fill in all doctor details');
          return;
        }
        profileData.licenseNumber = doctorData.licenseNumber;
        profileData.specialization = doctorData.specialization;
        profileData.hospitalId = doctorData.hospitalId;
        profileData.hospitalName = UGANDA_HOSPITALS.find(h => h.id === doctorData.hospitalId)?.name;
        profileData.status = 'pending';
      }

      await setDoc(doc(db, 'users', pendingUser.uid), profileData);
      setShowRoleModal(false);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Failed to create profile. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-700 p-8 lg:p-12"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2 neon-text">Welcome Back</h1>
          <p className="text-muted-foreground font-medium">Sign in to your PulsePoint account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground font-medium"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-bold text-foreground">Password</label>
              <a href="#" className="text-sm font-bold text-primary hover:text-primary/80">Forgot?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground font-medium"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-neon-blue text-slate-900 rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-neon-blue/20 flex items-center justify-center gap-2 disabled:opacity-50 neon-glow"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100 dark:border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-slate-800 text-slate-400">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3"
        >
          <Chrome className="w-5 h-5" />
          Google Account
        </button>

        <p className="mt-10 text-center text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-neon-blue hover:text-neon-blue-dark">Sign Up</Link>
        </p>
      </motion.div>

      {/* Role Selection Modal */}
      <AnimatePresence>
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-md w-full bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-700"
            >
              <h2 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-2 text-center">Complete Your Profile</h2>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-8">Please select your details to continue</p>
              
              <div className="space-y-6">
                {!selectedRole ? (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Gender / Sex</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['male', 'female', 'other'].map((g) => (
                          <button
                            key={g}
                            onClick={() => setSelectedGender(g)}
                            className={cn(
                              "py-2.5 rounded-xl border-2 font-bold text-xs capitalize transition-all",
                              selectedGender === g
                                ? "border-neon-blue bg-neon-blue/10 text-neon-blue"
                                : "border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:border-slate-200 dark:hover:border-slate-600"
                            )}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Select Role</label>
                      <div className="grid grid-cols-1 gap-4">
                        {[
                          { id: 'patient', label: 'I am a Patient', icon: UserCircle, desc: 'Book appointments and view records' },
                          { id: 'doctor', label: 'I am a Doctor', icon: Stethoscope, desc: 'Manage patients and write articles' },
                        ].map((r) => (
                          <button
                            key={r.id}
                            onClick={() => handleRoleSelect(r.id as any)}
                            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-neon-blue hover:bg-neon-blue/5 transition-all text-left group"
                          >
                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center group-hover:bg-neon-blue/10 transition-colors">
                              <r.icon className="w-6 h-6 text-slate-400 group-hover:text-neon-blue" />
                            </div>
                            <div>
                              <p className="font-bold text-[rgb(var(--foreground))]">{r.label}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{r.desc}</p>
                            </div>
                            <ArrowRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-neon-blue" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <button 
                      onClick={() => setSelectedRole(null)}
                      className="text-xs font-bold text-neon-blue hover:underline mb-2"
                    >
                      ← Back to role selection
                    </button>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Medical License #</label>
                      <input
                        type="text"
                        value={doctorData.licenseNumber}
                        onChange={(e) => setDoctorData({...doctorData, licenseNumber: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-neon-blue text-sm"
                        placeholder="LIC-123456"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Specialization</label>
                      <select
                        value={doctorData.specialization}
                        onChange={(e) => setDoctorData({...doctorData, specialization: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-neon-blue text-sm"
                      >
                        <option value="">Select specialization...</option>
                        {SPECIALIZATIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Hospital</label>
                      <select
                        value={doctorData.hospitalId}
                        onChange={(e) => setDoctorData({...doctorData, hospitalId: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-neon-blue text-sm"
                      >
                        <option value="">Select a hospital...</option>
                        {UGANDA_HOSPITALS.map(h => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => completeProfile('doctor')}
                      className="w-full py-3 bg-neon-blue text-slate-900 rounded-xl font-bold hover:bg-neon-blue-dark transition-all mt-4"
                    >
                      Complete Registration
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
