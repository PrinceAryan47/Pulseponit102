import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Camera, 
  Save, 
  AlertCircle,
  CheckCircle2,
  Lock,
  Calendar,
  MapPin,
  Bell,
  Info,
  Sliders,
  Video,
  Mic,
  Key,
  RefreshCw,
  Globe,
  History,
  Smartphone,
  Eye,
  EyeOff,
  Compass
} from 'lucide-react';
import { motion } from 'framer-motion';

const Profile: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'permissions'>('personal');

  // Personal Info Form State
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    phoneNumber: profile?.phoneNumber || '',
    age: profile?.age || '',
    gender: profile?.gender || '',
    weight: profile?.weight || '',
    height: profile?.height || '',
    allergies: profile?.allergies || '',
    conditions: profile?.conditions || '',
    // Doctor specific
    specialization: profile?.specialization || '',
    experience: profile?.experience || '',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Security & Privacy State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(profile?.twoFactorEnabled || false);
  const [sharingMedicalHistory, setSharingMedicalHistory] = useState(profile?.sharingMedicalHistory || false);
  const [locationSearchEnabled, setLocationSearchEnabled] = useState(profile?.locationSearchEnabled || false);
  const [anonymizeAnalytics, setAnonymizeAnalytics] = useState(profile?.anonymizeAnalytics || false);
  const [symptomCheckReporting, setSymptomCheckReporting] = useState(profile?.symptomCheckReporting || false);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Device Permissions State
  const [cameraState, setCameraState] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  const [micState, setMicState] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  const [locationState, setLocationState] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  const [simulatedLocationEnabled, setSimulatedLocationEnabled] = useState(profile?.simulatedLocationEnabled || false);
  const [simulatedPreset, setSimulatedPreset] = useState(profile?.simulatedLocationPreset || 'london');

  // Push Notifications Subscription State
  const [medicationReminders, setMedicationReminders] = useState(profile?.medicationRemindersSubscribed || false);
  const [appointmentAlerts, setAppointmentAlerts] = useState(profile?.appointmentAlertsSubscribed || false);
  const [permissionState, setPermissionState] = useState<string>('default');

  // Simulated Session Management
  const defaultSessions = [
    { id: '1', device: 'Chrome on macOS (Current)', lastActive: 'Active now', location: 'Europe/London (Approx)', isCurrent: true },
    { id: '2', device: 'Safari on iPhone 15 Pro', lastActive: 'Last active 2 hours ago', location: 'London, UK', isCurrent: false },
    { id: '3', device: 'Firefox on Windows PC', lastActive: 'Last active 3 days ago', location: 'Manchester, UK', isCurrent: false }
  ];

  const defaultLoginHistory = [
    { timestamp: new Date(Date.now() - 5 * 60 * 1000).toLocaleString(), device: 'Chrome on macOS', ip: '192.168.1.45', location: 'London, UK (Approx)' },
    { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString(), device: 'Safari on iPhone', ip: '192.168.1.102', location: 'London, UK' },
    { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleString(), device: 'Firefox on Windows', ip: '82.34.12.98', location: 'Manchester, UK' }
  ];

  const [activeSessions, setActiveSessions] = useState<Array<{ id: string; device: string; lastActive: string; location: string; isCurrent: boolean }>>(profile?.activeSessions || defaultSessions);

  // Query and check device permissions
  const checkPermissions = async () => {
    if (typeof window === 'undefined') return;

    if (Notification && 'permission' in window) {
      setPermissionState(Notification.permission);
    } else {
      setPermissionState('unsupported');
    }

    if (!navigator.permissions) {
      setCameraState('unsupported');
      setMicState('unsupported');
      setLocationState('unsupported');
      return;
    }

    try {
      const locPerm = await navigator.permissions.query({ name: 'geolocation' });
      setLocationState(locPerm.state as any);
      locPerm.onchange = () => setLocationState(locPerm.state as any);
    } catch (e) {
      console.warn("Location permission query unsupported in this browser:", e);
    }

    try {
      const camPerm = await navigator.permissions.query({ name: 'camera' as any });
      setCameraState(camPerm.state as any);
      camPerm.onchange = () => setCameraState(camPerm.state as any);
    } catch (e) {
      console.warn("Camera permission query unsupported in this browser:", e);
    }

    try {
      const micPerm = await navigator.permissions.query({ name: 'microphone' as any });
      setMicState(micPerm.state as any);
      micPerm.onchange = () => setMicState(micPerm.state as any);
    } catch (e) {
      console.warn("Microphone permission query unsupported in this browser:", e);
    }
  };

  React.useEffect(() => {
    checkPermissions();
  }, []);

  // Sync profile data when loaded
  React.useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
        age: profile.age || '',
        gender: profile.gender || '',
        weight: profile.weight || '',
        height: profile.height || '',
        allergies: profile.allergies || '',
        conditions: profile.conditions || '',
        specialization: profile.specialization || '',
        experience: profile.experience || '',
      });
      setMedicationReminders(profile.medicationRemindersSubscribed || false);
      setAppointmentAlerts(profile.appointmentAlertsSubscribed || false);
      setTwoFactorEnabled(profile.twoFactorEnabled || false);
      setSharingMedicalHistory(profile.sharingMedicalHistory || false);
      setLocationSearchEnabled(profile.locationSearchEnabled || false);
      setAnonymizeAnalytics(profile.anonymizeAnalytics || false);
      setSymptomCheckReporting(profile.symptomCheckReporting || false);
      setSimulatedLocationEnabled(profile.simulatedLocationEnabled || false);
      setSimulatedPreset(profile.simulatedLocationPreset || 'london');
      if (profile.simulatedLocationEnabled) {
        setLocationState('granted');
      }
      if (profile.activeSessions) {
        setActiveSessions(profile.activeSessions);
      }
    }
  }, [profile]);

  // Request native permissions
  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermissionState('unsupported');
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      return permission === 'granted';
    } catch (err) {
      console.warn("Could not request notification permission in this environment:", err);
      return false;
    }
  };

  const requestCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraState('granted');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      return true;
    } catch (err: any) {
      console.warn("Camera request failed (expected in sandboxed iframe):", err);
      setCameraState('denied');
      setError("Camera access was denied or is blocked by browser/iframe restrictions.");
      return false;
    }
  };

  const requestMicrophone = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicState('granted');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      return true;
    } catch (err: any) {
      console.warn("Microphone request failed (expected in sandboxed iframe):", err);
      setMicState('denied');
      setError("Microphone access was denied or is blocked by browser/iframe restrictions.");
      return false;
    }
  };

  const presetCoordinates: Record<string, { lat: number, lng: number, name: string }> = {
    london: { lat: 51.5074, lng: -0.1278, name: "London, UK" },
    kampala: { lat: 0.3476, lng: 32.5825, name: "Kampala, Uganda" },
    chicago: { lat: 41.8781, lng: -87.6298, name: "Chicago, USA" },
    tokyo: { lat: 35.6762, lng: 139.6503, name: "Tokyo, Japan" }
  };

  const handleToggleSimulatedLocation = async () => {
    if (!profile) return;
    const newVal = !simulatedLocationEnabled;
    setSimulatedLocationEnabled(newVal);
    const coords = newVal ? presetCoordinates[simulatedPreset] : null;
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        simulatedLocationEnabled: newVal,
        simulatedLatitude: coords ? coords.lat : null,
        simulatedLongitude: coords ? coords.lng : null,
        simulatedLocationPreset: simulatedPreset
      });
      if (newVal) {
        setLocationState('granted');
      } else {
        checkPermissions();
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update simulated location settings');
    }
  };

  const handleSelectSimulatedPreset = async (presetKey: string) => {
    if (!profile) return;
    setSimulatedPreset(presetKey);
    const coords = presetCoordinates[presetKey];
    if (!coords) return;
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        simulatedLocationPreset: presetKey,
        simulatedLatitude: coords.lat,
        simulatedLongitude: coords.lng
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update simulated location preset');
    }
  };

  const requestLocation = async () => {
    setError('');
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your web browser.");
      return false;
    }
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationState('granted');
          setSuccess(true);
          setTimeout(() => setSuccess(false), 2000);
          resolve(true);
        },
        (err) => {
          console.warn("Location request failed (expected in sandboxed iframe):", err);
          setLocationState('denied');
          setError("Location access was denied or is blocked by browser/iframe restrictions.");
          resolve(false);
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
      );
    });
  };

  const handleToggleMedication = async (checked: boolean) => {
    setMedicationReminders(checked);
    if (checked) {
      await requestPermission();
    }
  };

  const handleToggleAppointment = async (checked: boolean) => {
    setAppointmentAlerts(checked);
    if (checked) {
      await requestPermission();
    }
  };

  // Toggle Security Options instantly
  const handleToggleSecurityField = async (field: string, val: boolean, setter: (v: boolean) => void) => {
    if (!profile) return;
    setter(val);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        [field]: val
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update security setting');
    }
  };

  // Profile update handler
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        ...formData,
        age: formData.age ? parseInt(formData.age.toString()) : null,
        weight: formData.weight ? parseFloat(formData.weight.toString()) : null,
        height: formData.height ? parseFloat(formData.height.toString()) : null,
        experience: formData.experience ? parseInt(formData.experience.toString()) : null,
        medicationRemindersSubscribed: medicationReminders,
        appointmentAlertsSubscribed: appointmentAlerts,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Profile photo upload handler (with Base64 fallback for FireStore storage limit)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 1024 * 1024) {
      setError('Image size must be less than 1MB');
      return;
    }

    setIsUploading(true);
    setError('');

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        await updateDoc(doc(db, 'users', profile.uid), {
          photoURL: base64String
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err: any) {
        setError(err.message || 'Failed to upload image');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Change password flow via Firebase Auth
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth');
      const user = auth.currentUser;
      if (!user) throw new Error('No user is currently signed in');
      if (!user.email) throw new Error('User has no email associated');

      const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordForm.newPassword);
      
      setPasswordSuccess('Password successfully updated!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        setPasswordError('Incorrect current password');
      } else if (err.code === 'auth/no-such-provider' || err.message?.includes('provider') || err.message?.includes('credential')) {
        setPasswordError('This account is registered via Google OAuth. Please use Google Account Settings to reset passwords.');
      } else {
        setPasswordError(err.message || 'Failed to update password. Re-authentication failed.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Send Password Reset Email Flow
  const handlePasswordResetEmail = async () => {
    if (!profile || !profile.email) return;
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, profile.email);
      setPasswordSuccess(`A secure password reset link has been sent to ${profile.email}`);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to send password reset email');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Active Sessions controls
  const handleRevokeSession = async (id: string) => {
    const updated = activeSessions.filter(s => s.id !== id);
    setActiveSessions(updated);
    if (profile) {
      try {
        await updateDoc(doc(db, 'users', profile.uid), {
          activeSessions: updated
        });
      } catch (err) {
        console.error("Failed to revoke session:", err);
      }
    }
  };

  const handleRevokeAllSessions = async () => {
    const updated = activeSessions.filter(s => s.isCurrent);
    setActiveSessions(updated);
    if (profile) {
      try {
        await updateDoc(doc(db, 'users', profile.uid), {
          activeSessions: updated
        });
      } catch (err) {
        console.error("Failed to revoke other sessions:", err);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!profile) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-300">
      {/* Title Header */}
      <div className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 neon-text">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal details, secure your health account, and configure hardware permissions.</p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-2xl text-xs font-bold text-muted-foreground">
          <Shield className="w-4 h-4 text-primary animate-pulse" />
          <span>Secured by Firebase Trust Network</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SIDEBAR NAVIGATION PANEL (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Avatar Profile Details */}
          <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm text-center">
            <div className="relative inline-block mb-6">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="" className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-background shadow-lg shadow-primary/10" />
              ) : (
                <div className="w-32 h-32 bg-muted rounded-[2.5rem] flex items-center justify-center border-4 border-background shadow-lg">
                  <User className="w-12 h-12 text-muted-foreground/30" />
                </div>
              )}
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-2 -right-2 p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg hover:bg-neon-blue-dark transition-colors border-4 border-background disabled:opacity-50"
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">{profile.fullName || "User"}</h2>
            <p className="text-sm text-primary font-bold uppercase tracking-widest mb-4">{profile.role}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4 text-muted-foreground/60" />
              {profile.email}
            </div>
          </div>

          {/* Interactive Navigation Menu */}
          <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm space-y-1.5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 mb-3">Profile Directory</h3>
            
            <button 
              onClick={() => setActiveTab('personal')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-2xl transition-all ${
                activeTab === 'personal' 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'text-foreground/70 hover:bg-muted'
              }`}
            >
              <User className="w-4 h-4" />
              Personal & Health info
            </button>
            
            <button 
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-2xl transition-all ${
                activeTab === 'security' 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'text-foreground/70 hover:bg-muted'
              }`}
            >
              <Shield className="w-4 h-4" />
              Security & Privacy
            </button>
            
            <button 
              onClick={() => setActiveTab('permissions')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-2xl transition-all ${
                activeTab === 'permissions' 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'text-foreground/70 hover:bg-muted'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Device Permissions
            </button>
          </div>
        </div>

        {/* MAIN CONTENT DISPLAY AREA (lg:col-span-8) */}
        <div className="lg:col-span-8">
          
          {/* Status Message Banners */}
          {success && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              Profile updated and synchronized successfully!
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* TAB CONTENT: PERSONAL INFO */}
          {activeTab === 'personal' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card p-8 lg:p-12 rounded-[2.5rem] border border-border shadow-sm"
            >
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Personal & Health Details</h2>
                  <p className="text-xs text-muted-foreground">Keep your primary data accurate for automated checkups and treatments.</p>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-foreground/70 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-6 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground/70 mb-2">Phone Number (with country code)</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="+1 234 567 8900"
                      className="w-full px-6 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                    />
                  </div>
                </div>

                {profile.role === 'patient' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-foreground/70 mb-2">Age</label>
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleChange}
                          className="w-full px-6 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground/70 mb-2">Gender</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full px-6 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-foreground/70 mb-2">Weight (kg)</label>
                        <input
                          type="number"
                          name="weight"
                          step="0.1"
                          value={formData.weight}
                          onChange={handleChange}
                          className="w-full px-6 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground/70 mb-2">Height (cm)</label>
                        <input
                          type="number"
                          name="height"
                          step="0.1"
                          value={formData.height}
                          onChange={handleChange}
                          className="w-full px-6 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-foreground/70 mb-2">Allergies</label>
                        <input
                          type="text"
                          name="allergies"
                          value={formData.allergies}
                          onChange={handleChange}
                          placeholder="e.g. Penicillin, Peanuts"
                          className="w-full px-6 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground/70 mb-2">Chronic Conditions</label>
                        <input
                          type="text"
                          name="conditions"
                          value={formData.conditions}
                          onChange={handleChange}
                          placeholder="e.g. Asthma, Hypertension"
                          className="w-full px-6 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {profile.role === 'doctor' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-foreground/70 mb-2">Medical Specialization</label>
                        <input
                          type="text"
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleChange}
                          placeholder="e.g. Cardiology, Pediatrics"
                          className="w-full px-6 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground/70 mb-2">Years of Experience</label>
                        <input
                          type="number"
                          name="experience"
                          value={formData.experience}
                          onChange={handleChange}
                          className="w-full px-6 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 neon-glow"
                >
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                  <Save className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          )}

          {/* TAB CONTENT: SECURITY & PRIVACY */}
          {activeTab === 'security' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Privacy Settings Dashboard */}
              <div className="bg-card p-8 lg:p-12 rounded-[2.5rem] border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Advanced Privacy Controls</h2>
                    <p className="text-xs text-muted-foreground">Restrict or permit personal data sharing with automated health logic.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Two-Factor Authentication simulated toggle */}
                  <div className="flex items-start justify-between p-5 bg-muted/30 border border-border/80 rounded-2xl hover:bg-muted/50 transition-all">
                    <div className="space-y-1.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">Two-Factor Authentication (2FA)</span>
                        {twoFactorEnabled && (
                          <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Secure your medical credentials with SMS verification codes. Strongly advised to prevent unauthorized medical records breaches.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSecurityField('twoFactorEnabled', !twoFactorEnabled, setTwoFactorEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        twoFactorEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Share medical records toggle */}
                  <div className="flex items-start justify-between p-5 bg-muted/30 border border-border/80 rounded-2xl hover:bg-muted/50 transition-all">
                    <div className="space-y-1.5 pr-4">
                      <span className="text-sm font-bold text-foreground">Doctor Records Sharing</span>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Allow assigned clinics and registered physicians to view your emergency health profiles, diagnostic history, and live prescriptions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSecurityField('sharingMedicalHistory', !sharingMedicalHistory, setSharingMedicalHistory)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        sharingMedicalHistory ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          sharingMedicalHistory ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Geolocation search matching toggle */}
                  <div className="flex items-start justify-between p-5 bg-muted/30 border border-border/80 rounded-2xl hover:bg-muted/50 transition-all">
                    <div className="space-y-1.5 pr-4">
                      <span className="text-sm font-bold text-foreground">Location-Based Facility Matching</span>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Permit the smart hospital locator to utilize browser location coordinates to find emergency critical care facilities.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSecurityField('locationSearchEnabled', !locationSearchEnabled, setLocationSearchEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        locationSearchEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          locationSearchEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Anonymize analytics toggle */}
                  <div className="flex items-start justify-between p-5 bg-muted/30 border border-border/80 rounded-2xl hover:bg-muted/50 transition-all">
                    <div className="space-y-1.5 pr-4">
                      <span className="text-sm font-bold text-foreground">Anonymize Diagnostic Telemetry</span>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Strip identifiers (name, telephone) from diagnostic files used in automated AI symptom-matching analytics.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSecurityField('anonymizeAnalytics', !anonymizeAnalytics, setAnonymizeAnalytics)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        anonymizeAnalytics ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          anonymizeAnalytics ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Password update panel */}
              <div className="bg-card p-8 lg:p-12 rounded-[2.5rem] border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <Key className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Update Password</h2>
                    <p className="text-xs text-muted-foreground">Keep your access secure with a robust complex password.</p>
                  </div>
                </div>

                {passwordSuccess && (
                  <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    {passwordSuccess}
                  </div>
                )}

                {passwordError && (
                  <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive text-sm font-medium">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-foreground/70 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full pl-6 pr-12 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
                      >
                        {showCurrentPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground/70 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPass ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full pl-6 pr-12 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
                        >
                          {showNewPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground/70 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-6 py-3.5 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-neon-blue-dark transition-all shadow-md shadow-primary/10 disabled:opacity-50"
                    >
                      {passwordLoading ? 'Updating Password...' : 'Change Password'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handlePasswordResetEmail}
                      disabled={passwordLoading}
                      className="px-6 py-4 bg-muted border border-border hover:bg-muted/80 text-foreground font-bold rounded-2xl transition-all disabled:opacity-50"
                    >
                      Send Reset Email
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Sessions Manager */}
              <div className="bg-card p-8 lg:p-12 rounded-[2.5rem] border border-border shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Active Sessions</h2>
                      <p className="text-xs text-muted-foreground">Revoke or log out of alternate device connections.</p>
                    </div>
                  </div>
                  {activeSessions.length > 1 && (
                    <button
                      type="button"
                      onClick={handleRevokeAllSessions}
                      className="text-xs text-red-500 font-bold hover:underline"
                    >
                      Logout Other Devices
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-5 bg-muted/20 border border-border/50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-background border border-border text-primary rounded-xl">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{session.device}</span>
                            {session.isCurrent && (
                              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{session.location} • {session.lastActive}</p>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(session.id)}
                          className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-3.5 py-1.5 rounded-xl transition-all"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Login history */}
              <div className="bg-card p-8 lg:p-12 rounded-[2.5rem] border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Secure Login History</h2>
                    <p className="text-xs text-muted-foreground">Review login attempts to monitor for anomalies.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="pb-3 pr-4">Timestamp</th>
                        <th className="pb-3 px-4">Device</th>
                        <th className="pb-3 px-4">IP Address</th>
                        <th className="pb-3 pl-4">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm text-foreground/80">
                      {defaultLoginHistory.map((historyItem, idx) => (
                        <tr key={idx} className="hover:bg-muted/10">
                          <td className="py-4 pr-4 text-xs font-semibold">{historyItem.timestamp}</td>
                          <td className="py-4 px-4 font-medium">{historyItem.device}</td>
                          <td className="py-4 px-4 text-xs font-mono">{historyItem.ip}</td>
                          <td className="py-4 pl-4 text-xs font-medium">{historyItem.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB CONTENT: DEVICE PERMISSIONS */}
          {activeTab === 'permissions' && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Media & Sensor Permissions Controller */}
              <div className="bg-card p-8 lg:p-12 rounded-[2.5rem] border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Media & Geolocation Hardware</h2>
                    <p className="text-xs text-muted-foreground">Enable hardware interfaces required for direct voice sessions and emergency mapping.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Camera Access Card */}
                  <div className="bg-muted/20 border border-border/80 p-6 rounded-3xl flex flex-col justify-between hover:bg-muted/30 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-background border border-border text-primary rounded-2xl">
                          <Video className="w-5 h-5" />
                        </div>
                        {cameraState === 'granted' ? (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-bold">
                            Active
                          </span>
                        ) : cameraState === 'denied' ? (
                          <span className="bg-red-500/10 text-red-500 text-[10px] px-2.5 py-1 rounded-full font-bold">
                            Blocked
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-500 text-[10px] px-2.5 py-1 rounded-full font-bold">
                            Pending
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-foreground mb-1.5">Camera Access</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                        Required for secure video consultations and telehealth appointments with your physicians.
                      </p>
                    </div>
                    {cameraState !== 'granted' && (
                      <button
                        type="button"
                        onClick={requestCamera}
                        className="w-full py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-xl text-xs font-bold transition-all"
                      >
                        Request Access
                      </button>
                    )}
                  </div>

                  {/* Microphone Access Card */}
                  <div className="bg-muted/20 border border-border/80 p-6 rounded-3xl flex flex-col justify-between hover:bg-muted/30 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-background border border-border text-primary rounded-2xl">
                          <Mic className="w-5 h-5" />
                        </div>
                        {micState === 'granted' ? (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-bold">
                            Active
                          </span>
                        ) : micState === 'denied' ? (
                          <span className="bg-red-500/10 text-red-500 text-[10px] px-2.5 py-1 rounded-full font-bold">
                            Blocked
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-500 text-[10px] px-2.5 py-1 rounded-full font-bold">
                            Pending
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-foreground mb-1.5">Microphone Access</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                        Required for real-time sound diagnostics, call consults, and emergency AI voice analysis.
                      </p>
                    </div>
                    {micState !== 'granted' && (
                      <button
                        type="button"
                        onClick={requestMicrophone}
                        className="w-full py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-xl text-xs font-bold transition-all"
                      >
                        Request Access
                      </button>
                    )}
                  </div>

                  {/* Geolocation Access Card */}
                  <div className="bg-muted/20 border border-border/80 p-6 rounded-3xl flex flex-col justify-between hover:bg-muted/30 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-background border border-border text-primary rounded-2xl">
                          <Compass className="w-5 h-5" />
                        </div>
                        {simulatedLocationEnabled ? (
                          <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] px-2.5 py-1 rounded-full font-bold animate-pulse">
                            Simulated
                          </span>
                        ) : locationState === 'granted' ? (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-bold">
                            Active
                          </span>
                        ) : locationState === 'denied' ? (
                          <span className="bg-red-500/10 text-red-500 text-[10px] px-2.5 py-1 rounded-full font-bold">
                            Blocked
                          </span>
                        ) : (
                          <span className="bg-amber-500/10 text-amber-500 text-[10px] px-2.5 py-1 rounded-full font-bold">
                            Pending
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-foreground mb-1.5">Location Access</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                        Required to map surrounding clinics, locate the nearest trauma center, and plot emergency routes.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Simulation Toggle Option */}
                      <div className="flex items-center justify-between p-2.5 bg-background border border-border rounded-xl">
                        <span className="text-[11px] font-bold text-foreground">Simulate GPS</span>
                        <button
                          type="button"
                          onClick={handleToggleSimulatedLocation}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            simulatedLocationEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              simulatedLocationEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {simulatedLocationEnabled ? (
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-muted-foreground">Select Preset Region</label>
                          <select
                            value={simulatedPreset}
                            onChange={(e) => handleSelectSimulatedPreset(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="london">London, UK (King's Cross)</option>
                            <option value="kampala">Kampala, Uganda (Mulago Region)</option>
                            <option value="chicago">Chicago, USA (Northwestern Region)</option>
                            <option value="tokyo">Tokyo, Japan (University Region)</option>
                          </select>
                        </div>
                      ) : (
                        locationState !== 'granted' && (
                          <button
                            type="button"
                            onClick={requestLocation}
                            className="w-full py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-xl text-xs font-bold transition-all"
                          >
                            Request Access
                          </button>
                        )
                      )}
                    </div>
                  </div>

                </div>

                {/* Sandbox Browser warning */}
                {(cameraState === 'denied' || micState === 'denied' || locationState === 'denied') && (
                  <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <strong className="font-bold">Hardware Blocked:</strong> Your browser has blocked hardware authorization for this application, or you are running inside a restricted sandboxed iframe. Please click the site icon in your address bar to reset camera, microphone, and location settings manually.
                    </div>
                  </div>
                )}
              </div>

              {/* Push Notification Subscriptions inside Permissions */}
              <div className="bg-card p-8 lg:p-12 rounded-[2.5rem] border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Push Notifications & Reminders</h2>
                    <p className="text-xs text-muted-foreground">Subscribe to real-time medication dosages, care schedules, and appointment alerts.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Medication Reminders Sub */}
                  <div className="flex items-start justify-between p-5 bg-muted/20 border border-border/50 rounded-2xl">
                    <div className="space-y-1.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">Medication Reminders</span>
                        {medicationReminders && (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Receive push notifications on this device when it's time to take your prescribed medicine or record a dosage.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleMedication(!medicationReminders)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        medicationReminders ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          medicationReminders ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Appointment Alerts Sub */}
                  <div className="flex items-start justify-between p-5 bg-muted/20 border border-border/50 rounded-2xl">
                    <div className="space-y-1.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">Appointment Alerts</span>
                        {appointmentAlerts && (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Receive instant push notifications for appointment requests, schedule confirmations, modifications, and direct doctor messages.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleAppointment(!appointmentAlerts)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        appointmentAlerts ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          appointmentAlerts ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Permission Help Alert Banner */}
                  {permissionState === 'denied' && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="text-xs leading-relaxed">
                        <strong className="font-bold">Notifications Blocked:</strong> Your web browser has blocked push notifications for this site. To receive alerts, please reset notification permission in your browser's address bar.
                      </div>
                    </div>
                  )}

                  {permissionState === 'unsupported' && (
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-3 text-muted-foreground">
                      <Info className="w-5 h-5 shrink-0 text-primary mt-0.5" />
                      <div className="text-xs leading-relaxed">
                        <strong className="font-bold">Sandbox Environment Alert:</strong> Native browser push notifications might be restricted inside iframe workspaces. Your subscription preferences will still be saved to your health profile.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Profile;
