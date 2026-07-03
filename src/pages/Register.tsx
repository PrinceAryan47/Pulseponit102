import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, Mail, Lock, Phone, UserCircle, Stethoscope, Hospital, AlertCircle, ArrowRight, Building2, Eye, EyeOff, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole, Hospital as HospitalType } from '../types';
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

const Register: React.FC = () => {
  const [role, setRole] = useState<UserRole>('patient');
  const [hospitals, setHospitals] = useState<HospitalType[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    gender: 'male' as string,
    // Doctor specific
    licenseNumber: '',
    specialization: '',
    hospitalId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Google Authentication & Profile Completion States
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [selectedGender, setSelectedGender] = useState<string>('male');
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | null>(null);
  const [doctorData, setDoctorData] = useState({
    licenseNumber: '',
    specialization: '',
    hospitalId: ''
  });

  const handleGoogleLogin = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Check if profile exists, if not create it
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
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

  const handleRoleSelect = async (selected: 'patient' | 'doctor') => {
    setSelectedRole(selected);
    if (selected === 'patient') {
      await completeProfile(selected);
    }
  };

  const completeProfile = async (selected: 'patient' | 'doctor') => {
    if (!pendingUser) return;
    
    try {
      const profileData: any = {
        uid: pendingUser.uid,
        email: pendingUser.email,
        fullName: pendingUser.displayName || 'Anonymous',
        phoneNumber: pendingUser.phoneNumber || '',
        gender: selectedGender,
        role: selected,
        status: 'approved',
        createdAt: serverTimestamp(),
        photoURL: pendingUser.photoURL || '',
      };

      if (selected === 'doctor') {
        if (!doctorData.licenseNumber || !doctorData.specialization || !doctorData.hospitalId) {
          setError('Please fill in all doctor details');
          return;
        }
        profileData.licenseNumber = doctorData.licenseNumber;
        profileData.specialization = doctorData.specialization;
        profileData.hospitalId = doctorData.hospitalId;
        profileData.hospitalName = hospitals.find(h => h.id === doctorData.hospitalId)?.name || '';
        profileData.status = 'pending';
      }

      await setDoc(doc(db, 'users', pendingUser.uid), profileData);
      setShowRoleModal(false);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Failed to create profile. Please try again.');
    }
  };

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'hospitals'));
        const hospitalList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HospitalType));
        setHospitals(hospitalList);
      } catch (err) {
        console.error("Error fetching hospitals:", err);
      } finally {
        setHospitalsLoading(false);
      }
    };
    fetchHospitals();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Check if email is already in registry (to prevent duplicate emails across different UIDs if needed, 
      // though Firebase Auth handles this for the same provider)
      const emailRef = doc(db, 'emails', formData.email.toLowerCase());
      const emailSnap = await getDocs(query(collection(db, 'emails'), where('email', '==', formData.email.toLowerCase())));
      
      if (!emailSnap.empty) {
        setError('This email is already registered. Please use a different email or sign in.');
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Add to email registry first
      await setDoc(doc(db, 'emails', formData.email.toLowerCase()), {
        email: formData.email.toLowerCase(),
        uid: user.uid,
        createdAt: serverTimestamp()
      });

      const profileData: any = {
        uid: user.uid,
        email: formData.email,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        gender: formData.gender,
        role: role,
        isOnline: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      if (role === 'doctor') {
        profileData.licenseNumber = formData.licenseNumber;
        profileData.specialization = formData.specialization;
        profileData.hospitalId = formData.hospitalId;
        profileData.hospitalName = hospitals.find(h => h.id === formData.hospitalId)?.name || '';
        profileData.status = 'pending';
        profileData.licenseVerificationStatus = 'pending';
        profileData.hospitalApprovalStatus = 'pending';
      }

      await setDoc(doc(db, 'users', user.uid), profileData);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setError('Domain not authorized. Please add this domain to the "Authorized domains" list in your Firebase Console (Authentication > Settings).');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Registration is not enabled. Please enable Email/Password sign-in in your Firebase Console (Authentication > Sign-in method).');
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 py-12 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-700 p-8 lg:p-12"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2 neon-text">Create Account</h1>
          <p className="text-muted-foreground font-medium">Join PulsePoint health community</p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {[
            { id: 'patient', label: 'Patient', icon: UserCircle },
            { id: 'doctor', label: 'Doctor', icon: Stethoscope },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id as UserRole)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                role === r.id 
                  ? 'border-neon-blue bg-neon-blue/10 text-neon-blue' 
                  : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:border-slate-200 dark:hover:border-slate-600'
              }`}
            >
              <r.icon className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-wider">{r.label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground font-medium"
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground font-medium"
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Gender / Sex</label>
            <div className="grid grid-cols-3 gap-4">
              {['male', 'female', 'other'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: g })}
                  className={cn(
                    "py-3 rounded-2xl border-2 font-bold text-sm capitalize transition-all",
                    formData.gender === g
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
            <label className="block text-sm font-bold text-foreground mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground font-medium"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
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

          {role === 'doctor' && (
            <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Medical License #</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    required
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue focus:border-neon-blue outline-none transition-all text-[rgb(var(--foreground))]"
                    placeholder="LIC-123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Specialization</label>
                  <select
                    name="specialization"
                    required
                    value={formData.specialization}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue focus:border-neon-blue outline-none transition-all text-[rgb(var(--foreground))]"
                  >
                    <option value="">Select specialization...</option>
                    {SPECIALIZATIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Select Hospital</label>
                <select
                  name="hospitalId"
                  required
                  disabled={hospitalsLoading}
                  value={formData.hospitalId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-neon-blue focus:border-neon-blue outline-none transition-all text-[rgb(var(--foreground))] disabled:opacity-50"
                >
                  <option value="">{hospitalsLoading ? 'Loading hospitals...' : 'Select a hospital...'}</option>
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-neon-blue text-slate-900 rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-neon-blue/20 flex items-center justify-center gap-2 disabled:opacity-50 neon-glow"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
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
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3"
        >
          <Chrome className="w-5 h-5" />
          Google Account
        </button>

        <p className="mt-10 text-center text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-neon-blue hover:text-neon-blue-dark">Sign In</Link>
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
              <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Complete Your Profile</h2>
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
                            type="button"
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
                            type="button"
                            onClick={() => handleRoleSelect(r.id as any)}
                            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-neon-blue hover:bg-neon-blue/5 transition-all text-left group"
                          >
                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center group-hover:bg-neon-blue/10 transition-colors">
                              <r.icon className="w-6 h-6 text-slate-400 group-hover:text-neon-blue" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{r.label}</p>
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
                      type="button"
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
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-neon-blue text-sm text-foreground"
                        placeholder="LIC-123456"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Specialization</label>
                      <select
                        value={doctorData.specialization}
                        onChange={(e) => setDoctorData({...doctorData, specialization: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-neon-blue text-sm text-foreground"
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
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-neon-blue text-sm text-foreground"
                      >
                        <option value="">Select a hospital...</option>
                        {hospitals.map(h => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
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

export default Register;
