import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
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
  MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';

const Profile: React.FC = () => {
  const { profile } = useAuth();
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
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Check file size (limit to 1MB for base64 storage in Firestore)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-300">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 neon-text">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and health settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
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
                <img src={profile.photoURL} alt="" className="w-32 h-32 rounded-[2rem] object-cover border-4 border-background shadow-lg" />
              ) : (
                <div className="w-32 h-32 bg-muted rounded-[2rem] flex items-center justify-center border-4 border-background shadow-lg">
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
            <h2 className="text-xl font-bold text-foreground mb-1">{profile.fullName}</h2>
            <p className="text-sm text-primary font-bold uppercase tracking-widest mb-4">{profile.role}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              {profile.email}
            </div>
          </div>

          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Account Security</h3>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors">
              <Lock className="w-4 h-4" />
              Change Password
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors">
              <Shield className="w-4 h-4" />
              Privacy Settings
            </button>
          </div>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card p-8 lg:p-12 rounded-[2.5rem] border border-border shadow-sm"
          >
            {success && (
              <div className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3 text-primary text-sm font-medium">
                <CheckCircle2 className="w-5 h-5" />
                Profile updated successfully!
              </div>
            )}

            {error && (
              <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive text-sm font-medium">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground/70 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-6 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
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
                    className="w-full px-6 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                  />
                </div>
              </div>

              {profile.role === 'patient' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground/70 mb-2">Age</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        className="w-full px-6 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground/70 mb-2">Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-6 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
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
                        className="w-full px-6 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                        placeholder="e.g. 70"
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
                        className="w-full px-6 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                        placeholder="e.g. 175"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground/70 mb-2">Allergies</label>
                    <textarea
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-6 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all resize-none text-foreground"
                      placeholder="List any allergies..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground/70 mb-2">Existing Conditions</label>
                    <textarea
                      name="conditions"
                      value={formData.conditions}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-6 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all resize-none text-foreground"
                      placeholder="List any chronic conditions..."
                    />
                  </div>
                </>
              )}

              {profile.role === 'doctor' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-foreground/70 mb-2">Specialization</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="w-full px-6 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground/70 mb-2">Years of Experience</label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      className="w-full px-6 py-3 bg-muted/50 border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                    />
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
        </div>
      </div>
    </div>
  );
};

export default Profile;
