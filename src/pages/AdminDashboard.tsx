import React, { useState, useEffect } from 'react';
import { 
  Users, 
  User,
  Hospital, 
  FileText, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Eye,
  UserCheck,
  UserX,
  ArrowUpRight,
  Activity,
  Download,
  X,
  Calendar as CalendarIcon,
  MessageSquare,
  TrendingUp,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';
import { collection, query, getDocs, getDoc, setDoc, serverTimestamp, updateDoc, doc, where, orderBy, limit, getCountFromServer, deleteDoc, addDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};
import { UserProfile, Hospital as HospitalType, Article } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { generateHealthNews, publishGeneratedNews, GeneratedArticle } from '../services/newsAiService';
import { useAuth } from '../context/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'hospitals' | 'verifications' | 'articles' | 'analyzer' | 'danger'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [hospitals, setHospitals] = useState<HospitalType[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    requireText?: string;
    type?: 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    isOpen: false,
    message: '',
    type: 'success'
  });

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      // Handle Firestore Timestamp
      if (date && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
      }
      // Handle ISO string or Date object
      return new Date(date).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };
  const [showReportModal, setShowReportModal] = useState(false);
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [editingHospital, setEditingHospital] = useState<HospitalType | null>(null);
  const [hospitalFormData, setHospitalFormData] = useState({
    name: '',
    address: '',
    contactPhone: '',
    contactEmail: '',
    services: '',
    openingHours: '24/7',
    photoURL: '',
    licenseNumber: ''
  });
  const [systemStats, setSystemStats] = useState<{
    totalUsers: number;
    totalPatients: number;
    totalDoctors: number;
    totalHospitals: number;
    totalAppointments: number;
    totalArticles: number;
    totalMessages: number;
    pendingVerifications: number;
    lastRefresh: string;
  } | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Settings State
  const [settings, setSettings] = useState<{
    autoGenerateNews: boolean;
    newsUpdateFrequency: number;
    lastNewsUpdate: any;
  }>({
    autoGenerateNews: true,
    newsUpdateFrequency: 7,
    lastNewsUpdate: null
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // AI News Generation State
  const [isGeneratingNews, setIsGeneratingNews] = useState(false);
  const [generatedNews, setGeneratedNews] = useState<GeneratedArticle[]>([]);
  const [showNewsPreview, setShowNewsPreview] = useState(false);

  useEffect(() => {
    setLoading(true);
    let unsubUsers = () => {};
    let unsubArticles = () => {};
    let unsubHospitals = () => {};

    if (activeTab === 'users' || activeTab === 'verifications') {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      unsubUsers = onSnapshot(q, (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
        setLoading(false);
      }, (error) => {
        if (error.code === 'permission-denied') {
          console.warn("Permission denied for users list. This is expected if you are not an admin.");
          setLoading(false);
        } else {
          handleFirestoreError(error, OperationType.LIST, 'users');
        }
      });
    }

    if (activeTab === 'articles') {
      const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
      unsubArticles = onSnapshot(q, (snapshot) => {
        setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Article)));
        setLoading(false);
      }, (error) => {
        if (error.code === 'permission-denied') {
          setLoading(false);
        } else {
          handleFirestoreError(error, OperationType.LIST, 'articles');
        }
      });
    }

    if (activeTab === 'hospitals') {
      const q = query(collection(db, 'hospitals'), orderBy('name', 'asc'));
      unsubHospitals = onSnapshot(q, (snapshot) => {
        setHospitals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HospitalType)));
        setLoading(false);
      }, (error) => {
        if (error.code === 'permission-denied') {
          setLoading(false);
        } else {
          handleFirestoreError(error, OperationType.LIST, 'hospitals');
        }
      });
    }

    if (activeTab === 'analyzer') {
      const fetchSettings = async () => {
        try {
          const docRef = doc(db, 'settings', 'news_config');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setSettings({
              autoGenerateNews: data.autoGenerate ?? true,
              newsUpdateFrequency: data.frequency ?? 7,
              lastNewsUpdate: data.lastUpdate
            });
          }
          setLoading(false);
        } catch (error) {
          console.error("Error fetching settings:", error);
          setLoading(false);
        }
      };
      fetchSettings();
    }

    return () => {
      unsubUsers();
      unsubArticles();
      unsubHospitals();
    };
  }, [activeTab]);

  const fetchSystemStats = async () => {
    setIsGeneratingReport(true);
    try {
      const [
        usersSnap,
        patientsSnap,
        doctorsSnap,
        hospitalsSnap,
        appointmentsSnap,
        articlesSnap,
        messagesSnap,
        pendingSnap
      ] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(query(collection(db, 'users'), where('role', '==', 'patient'))),
        getCountFromServer(query(collection(db, 'users'), where('role', '==', 'doctor'))),
        getCountFromServer(collection(db, 'hospitals')),
        getCountFromServer(collection(db, 'appointments')),
        getCountFromServer(collection(db, 'articles')),
        getCountFromServer(collection(db, 'messages')),
        getCountFromServer(query(collection(db, 'users'), where('role', '==', 'doctor'), where('status', '==', 'pending')))
      ]);

      setSystemStats({
        totalUsers: usersSnap.data().count,
        totalPatients: patientsSnap.data().count,
        totalDoctors: doctorsSnap.data().count,
        totalHospitals: hospitalsSnap.data().count,
        totalAppointments: appointmentsSnap.data().count,
        totalArticles: articlesSnap.data().count,
        totalMessages: messagesSnap.data().count,
        pendingVerifications: pendingSnap.data().count,
        lastRefresh: new Date().toLocaleString()
      });
      setShowReportModal(true);
    } catch (error) {
      console.error("Error fetching system stats:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const fetchData = async () => {
    // This is now handled by onSnapshot in useEffect
  };

  const handleVerifyDoctor = async (userId: string, status: 'approved' | 'rejected') => {
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, 'users', userId), {
        status,
        licenseVerificationStatus: status === 'approved' ? 'verified' : 'rejected'
      });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'news_config'), {
        autoGenerate: settings.autoGenerateNews,
        frequency: settings.newsUpdateFrequency,
        lastUpdate: settings.lastNewsUpdate || serverTimestamp()
      }, { merge: true });
      setAlertConfig({ isOpen: true, message: "Settings saved successfully.", type: 'success' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/news_config');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleGenerateNews = async () => {
    setIsGeneratingNews(true);
    try {
      const news = await generateHealthNews();
      setGeneratedNews(news);
      setShowNewsPreview(true);
    } catch (error) {
      console.error("Error generating news:", error);
      alert("Failed to generate news. Please try again.");
    } finally {
      setIsGeneratingNews(false);
    }
  };

  const handlePublishNews = async () => {
    if (!user || !profile) return;
    const path = 'articles';
    try {
      await publishGeneratedNews(generatedNews, user.uid, profile.fullName);
      setShowNewsPreview(false);
      setGeneratedNews([]);
      if (activeTab === 'articles') fetchData();
      alert("News published successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this article?")) return;
    const path = `articles/${id}`;
    try {
      await deleteDoc(doc(db, 'articles', id));
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleDeleteHospital = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this hospital? This will affect doctors registered at this facility.")) return;
    const path = `hospitals/${id}`;
    try {
      await deleteDoc(doc(db, 'hospitals', id));
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleSaveHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = editingHospital ? `hospitals/${editingHospital.id}` : 'hospitals';
    try {
      const data = {
        ...hospitalFormData,
        services: hospitalFormData.services.split(',').map(s => s.trim()).filter(s => s !== '')
      };

      if (editingHospital) {
        await updateDoc(doc(db, 'hospitals', editingHospital.id), data);
      } else {
        await addDoc(collection(db, 'hospitals'), data);
      }

      setShowHospitalModal(false);
      setEditingHospital(null);
      setHospitalFormData({
        name: '',
        address: '',
        contactPhone: '',
        contactEmail: '',
        services: '',
        openingHours: '24/7',
        photoURL: '',
        licenseNumber: ''
      });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, editingHospital ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const openHospitalModal = (hospital?: HospitalType) => {
    if (hospital) {
      setEditingHospital(hospital);
      setHospitalFormData({
        name: hospital.name,
        address: hospital.address,
        contactPhone: hospital.contactPhone,
        contactEmail: hospital.contactEmail,
        services: hospital.services.join(', '),
        openingHours: hospital.openingHours,
        photoURL: hospital.photoURL || '',
        licenseNumber: hospital.licenseNumber || ''
      });
    } else {
      setEditingHospital(null);
      setHospitalFormData({
        name: '',
        address: '',
        contactPhone: '',
        contactEmail: '',
        services: '',
        openingHours: '24/7',
        photoURL: '',
        licenseNumber: ''
      });
    }
    setShowHospitalModal(true);
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Hospitals', value: hospitals.length, icon: Hospital, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Pending Verifications', value: users.filter(u => u.role === 'doctor' && u.status === 'pending').length, icon: Shield, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Active Articles', value: articles.length || 0, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[rgb(var(--foreground))] tracking-tighter uppercase neon-text">Admin Control Panel</h1>
          <p className="text-slate-500 font-medium">Manage platform users, hospitals, and verifications.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'hospitals' && (
            <button 
              onClick={() => openHospitalModal()}
              className="px-6 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 hover:scale-105 transition-all flex items-center gap-2 uppercase tracking-tighter"
            >
              <Plus className="w-5 h-5" />
              Add Hospital
            </button>
          )}
          {activeTab === 'articles' && (
            <button 
              onClick={handleGenerateNews}
              disabled={isGeneratingNews}
              className="px-6 py-3 bg-purple-600 text-white font-black rounded-2xl shadow-xl shadow-purple-600/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-tighter"
            >
              {isGeneratingNews ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {isGeneratingNews ? 'Analyzing...' : 'AI News Analyzer'}
            </button>
          )}
          <button 
            onClick={fetchSystemStats}
            disabled={isGeneratingReport}
            className="px-6 py-3 bg-neon-blue text-slate-900 font-black rounded-2xl shadow-xl shadow-neon-blue/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed neon-glow uppercase tracking-tighter"
          >
            {isGeneratingReport ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
            {isGeneratingReport ? 'Generating...' : 'System Report'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[rgb(var(--background))] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-2xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <Activity className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-2xl font-black text-[rgb(var(--foreground))]">{stat.value}</p>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content Card */}
      <div className="bg-[rgb(var(--background))] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {(['users', 'hospitals', 'verifications', 'articles', 'analyzer', 'danger'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-8 py-5 text-sm font-black uppercase tracking-widest transition-all relative whitespace-nowrap",
                activeTab === tab 
                  ? "text-neon-blue" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
              {tab.replace('-', ' ')}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-neon-blue"
                />
              )}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'articles' ? "Search articles..." : "Search by name or email..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neon-blue/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-3 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
              <Filter className="w-5 h-5" />
            </button>
            <button className="p-3 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table/Content Area */}
        <div className="overflow-x-auto">
          {activeTab === 'danger' ? (
            <div className="p-8 space-y-8">
              <div className="p-8 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-[2rem]">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl text-red-600 dark:text-red-400">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-red-600 dark:text-red-400 uppercase tracking-tighter">Danger Zone</h2>
                    <p className="text-slate-500 font-medium">Critical system actions. Use with extreme caution.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-red-100 dark:border-red-900/20 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete All Users</h3>
                    <p className="text-sm text-slate-500 mb-6">This will permanently remove all user profiles from the database. Note: This does not remove them from Firebase Authentication.</p>
                    <button 
                      onClick={() => {
                        setModalConfig({
                          isOpen: true,
                          title: "Delete All Users",
                          message: "ARE YOU ABSOLUTELY SURE? This will delete ALL user profiles from Firestore. This action cannot be undone.",
                          requireText: "DELETE ALL",
                          type: 'danger',
                          onConfirm: async () => {
                            try {
                              const userDocs = await getDocs(collection(db, 'users'));
                              const deletePromises = userDocs.docs
                                .filter(d => d.id !== auth.currentUser?.uid) // Skip current admin
                                .map(d => deleteDoc(d.ref));
                              await Promise.all(deletePromises);
                              setAlertConfig({ isOpen: true, message: "All other user profiles deleted successfully.", type: 'success' });
                            } catch (error) {
                              handleFirestoreError(error, OperationType.DELETE, 'users');
                            }
                          }
                        });
                      }}
                      className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 uppercase tracking-tighter"
                    >
                      <Trash2 className="w-5 h-5" />
                      Delete All Users
                    </button>
                  </div>

                  <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-red-100 dark:border-red-900/20 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Reset Email Registry</h3>
                    <p className="text-sm text-slate-500 mb-6">Clears the unique email registry. Use this if you want to allow re-registration of previously used emails after deleting users.</p>
                    <button 
                      onClick={() => {
                        setModalConfig({
                          isOpen: true,
                          title: "Clear Email Registry",
                          message: "Delete all registered emails? This will allow previously used emails to register again.",
                          type: 'danger',
                          onConfirm: async () => {
                            try {
                              const emailDocs = await getDocs(collection(db, 'emails'));
                              const deletePromises = emailDocs.docs.map(d => deleteDoc(d.ref));
                              await Promise.all(deletePromises);
                              setAlertConfig({ isOpen: true, message: "Email registry cleared.", type: 'success' });
                            } catch (error) {
                              handleFirestoreError(error, OperationType.DELETE, 'emails');
                            }
                          }
                        });
                      }}
                      className="w-full py-4 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2 uppercase tracking-tighter"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Clear Email Registry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'analyzer' ? (
            <div className="p-8 space-y-8">
              <div className="max-w-4xl space-y-8">
                {/* Main Action Card */}
                <div className="p-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2.5rem] text-white shadow-2xl shadow-purple-500/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 bg-white/20 backdrop-blur-md rounded-3xl">
                        <Sparkles className="w-10 h-10 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black tracking-tighter uppercase">AI Internet Analyzer</h2>
                        <p className="text-purple-100 font-medium">Scan the global web for the latest health breakthroughs and news.</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={handleGenerateNews}
                        disabled={isGeneratingNews}
                        className="px-8 py-4 bg-white text-purple-700 font-black rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 uppercase tracking-tighter shadow-xl disabled:opacity-50"
                      >
                        {isGeneratingNews ? (
                          <div className="w-5 h-5 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Activity className="w-5 h-5" />
                        )}
                        {isGeneratingNews ? 'Analyzing Web...' : 'Start Real-time Analysis'}
                      </button>
                      <div className="flex items-center gap-3 px-6 py-4 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10">
                        <Clock className="w-5 h-5 text-purple-200" />
                        <span className="text-sm font-bold text-purple-100">
                          Last Scan: {settings.lastNewsUpdate ? formatDate(settings.lastNewsUpdate) : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-[rgb(var(--background))] rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-[rgb(var(--foreground))]">Automatic Scanning</h3>
                        <p className="text-xs text-slate-500">Enable weekly autonomous internet research.</p>
                      </div>
                      <button 
                        onClick={() => setSettings({...settings, autoGenerateNews: !settings.autoGenerateNews})}
                        className={cn(
                          "w-14 h-8 rounded-full p-1 transition-all",
                          settings.autoGenerateNews ? "bg-purple-600" : "bg-slate-200 dark:bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 bg-white rounded-full shadow-sm transition-all",
                          settings.autoGenerateNews ? "translate-x-6" : "translate-x-0"
                        )} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-[rgb(var(--foreground))]">Scan Frequency</p>
                        <span className="px-3 py-1 bg-purple-500/10 text-purple-500 rounded-lg text-xs font-black">
                          Every {settings.newsUpdateFrequency} Days
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="30" 
                        value={settings.newsUpdateFrequency}
                        onChange={(e) => setSettings({...settings, newsUpdateFrequency: parseInt(e.target.value)})}
                        className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                    </div>

                    <button 
                      onClick={handleSaveSettings}
                      disabled={isSavingSettings}
                      className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-tighter"
                    >
                      {isSavingSettings ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Shield className="w-5 h-5" />
                      )}
                      Save Configuration
                    </button>
                  </div>

                  <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center text-center space-y-4">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-sm">
                      <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[rgb(var(--foreground))]">Analysis Engine</h3>
                      <p className="text-xs text-slate-500 max-w-[200px] mx-auto">Powered by Gemini 3.0 Flash for high-speed medical data processing.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 font-bold animate-pulse">Fetching records...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                    {activeTab === 'articles' ? 'Title / Author' : 'Name / Email'}
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                    {activeTab === 'articles' ? 'Category' : 'Role'}
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                    {activeTab === 'articles' ? 'Published' : 'Joined'}
                  </th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeTab === 'users' && filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[rgb(var(--foreground))]">{user.fullName}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        user.role === 'doctor' ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.status === 'approved' || user.role === 'patient' ? (
                          <div className="flex items-center gap-1.5 text-emerald-500">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-bold">Active</span>
                          </div>
                        ) : user.status === 'pending' ? (
                          <div className="flex items-center gap-1.5 text-amber-500">
                            <AlertCircle className="w-4 h-4 animate-pulse" />
                            <span className="text-xs font-bold">Pending</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs font-bold">Inactive</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-neon-blue hover:bg-neon-blue/10 rounded-lg transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                        {user.role === 'doctor' && user.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleVerifyDoctor(user.uid, 'approved')}
                              className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                              title="Approve Doctor"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleVerifyDoctor(user.uid, 'rejected')}
                              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                              title="Reject Doctor"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => {
                            setModalConfig({
                              isOpen: true,
                              title: "Delete User",
                              message: `Delete profile for ${user.fullName}? This cannot be undone.`,
                              type: 'danger',
                              onConfirm: async () => {
                                if (user.uid === auth.currentUser?.uid) {
                                  setAlertConfig({ isOpen: true, message: "You cannot delete your own admin profile.", type: 'error' });
                                  return;
                                }
                                try {
                                  await deleteDoc(doc(db, 'users', user.uid));
                                  if (user.email) {
                                    await deleteDoc(doc(db, 'emails', user.email.toLowerCase()));
                                  }
                                  setAlertConfig({ isOpen: true, message: "User deleted successfully.", type: 'success' });
                                } catch (error) {
                                  handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}`);
                                }
                              }
                            });
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {activeTab === 'hospitals' && hospitals.map((hospital) => (
                  <tr key={hospital.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
                          {hospital.photoURL ? (
                            <img src={hospital.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Hospital className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[rgb(var(--foreground))]">{hospital.name}</p>
                          <p className="text-xs text-slate-500">{hospital.contactEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {hospital.licenseNumber || 'No License'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-emerald-500">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-bold">Verified</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {hospital.openingHours}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openHospitalModal(hospital)}
                          className="p-2 text-slate-400 hover:text-neon-blue hover:bg-neon-blue/10 rounded-lg transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteHospital(hospital.id)}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {activeTab === 'verifications' && users.filter(u => u.role === 'doctor' && u.status === 'pending').map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[rgb(var(--foreground))]">{user.fullName}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground">{user.specialization}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">License: {user.licenseNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-amber-500">
                        <AlertCircle className="w-4 h-4 animate-pulse" />
                        <span className="text-xs font-bold">Pending Review</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleVerifyDoctor(user.uid, 'approved')}
                          className="px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleVerifyDoctor(user.uid, 'rejected')}
                          className="px-4 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-500 hover:text-white transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {activeTab === 'articles' && articles.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
                          <img src={article.imageURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <p className="font-bold text-[rgb(var(--foreground))] line-clamp-1">{article.title}</p>
                          <p className="text-xs text-slate-500">{article.authorName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-500">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-emerald-500">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-bold">Published</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {formatDate(article.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-neon-blue hover:bg-neon-blue/10 rounded-lg transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteArticle(article.id)}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* AI News Preview Modal */}
      <AnimatePresence>
        {showHospitalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[rgb(var(--background))] w-full max-w-2xl rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl">
                    <Hospital className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[rgb(var(--foreground))] tracking-tighter uppercase">
                      {editingHospital ? 'Edit Hospital' : 'Add New Hospital'}
                    </h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Partner medical facility details</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHospitalModal(false)}
                  className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSaveHospital} className="p-8 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Hospital Name</label>
                    <input 
                      type="text" 
                      required
                      value={hospitalFormData.name}
                      onChange={(e) => setHospitalFormData({...hospitalFormData, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">License Number</label>
                    <input 
                      type="text" 
                      required
                      value={hospitalFormData.licenseNumber}
                      onChange={(e) => setHospitalFormData({...hospitalFormData, licenseNumber: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">Address</label>
                  <input 
                    type="text" 
                    required
                    value={hospitalFormData.address}
                    onChange={(e) => setHospitalFormData({...hospitalFormData, address: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Contact Phone</label>
                    <input 
                      type="text" 
                      required
                      value={hospitalFormData.contactPhone}
                      onChange={(e) => setHospitalFormData({...hospitalFormData, contactPhone: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Contact Email</label>
                    <input 
                      type="email" 
                      required
                      value={hospitalFormData.contactEmail}
                      onChange={(e) => setHospitalFormData({...hospitalFormData, contactEmail: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">Services (comma separated)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Surgery, Pediatrics, Maternity..."
                    value={hospitalFormData.services}
                    onChange={(e) => setHospitalFormData({...hospitalFormData, services: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Opening Hours</label>
                    <input 
                      type="text" 
                      required
                      value={hospitalFormData.openingHours}
                      onChange={(e) => setHospitalFormData({...hospitalFormData, openingHours: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Photo URL</label>
                    <input 
                      type="text" 
                      value={hospitalFormData.photoURL}
                      onChange={(e) => setHospitalFormData({...hospitalFormData, photoURL: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button 
                    type="button"
                    onClick={() => setShowHospitalModal(false)}
                    className="px-8 py-4 text-slate-500 font-black uppercase tracking-tighter"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-10 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 hover:scale-105 transition-all flex items-center gap-2 uppercase tracking-tighter"
                  >
                    {editingHospital ? 'Update Hospital' : 'Save Hospital'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNewsPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[rgb(var(--background))] w-full max-w-4xl max-h-[90vh] rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-purple-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/10 rounded-2xl">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[rgb(var(--foreground))] tracking-tighter uppercase">AI Generated News</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Review and publish the latest health updates</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowNewsPreview(false)}
                  className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto no-scrollbar space-y-8 flex-grow">
                {generatedNews.map((news, i) => (
                  <div key={i} className="flex gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div className="w-40 h-40 rounded-2xl overflow-hidden shrink-0">
                      <img src={news.imageURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="space-y-3">
                      <span className="px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {news.category}
                      </span>
                      <h3 className="text-xl font-bold text-[rgb(var(--foreground))]">{news.title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{news.summary}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button 
                  onClick={() => setShowNewsPreview(false)}
                  className="px-8 py-4 text-slate-500 font-black uppercase tracking-tighter"
                >
                  Discard
                </button>
                <button 
                  onClick={handlePublishNews}
                  className="px-10 py-4 bg-purple-600 text-white font-black rounded-2xl shadow-xl shadow-purple-600/20 hover:scale-105 transition-all flex items-center gap-2 uppercase tracking-tighter neon-glow"
                >
                  <Plus className="w-5 h-5" />
                  Publish All Articles
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* System Report Modal */}
      <AnimatePresence>
        {showReportModal && systemStats && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[rgb(var(--background))] w-full max-w-2xl rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <h2 className="text-2xl font-black text-[rgb(var(--foreground))] tracking-tighter uppercase">System Health Report</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Generated at {systemStats.lastRefresh}</p>
                </div>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <div className="p-8 grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl">
                      <Users className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[rgb(var(--foreground))]">{systemStats.totalUsers}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Registered Users</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl">
                      <Hospital className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[rgb(var(--foreground))]">{systemStats.totalHospitals}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Partner Hospitals</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-2xl">
                      <CalendarIcon className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[rgb(var(--foreground))]">{systemStats.totalAppointments}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Appointments</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl">
                      <Shield className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[rgb(var(--foreground))]">{systemStats.pendingVerifications}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pending Verifications</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-500/10 rounded-2xl">
                      <MessageSquare className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[rgb(var(--foreground))]">{systemStats.totalMessages}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform Messages</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-2xl">
                      <TrendingUp className="w-6 h-6 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[rgb(var(--foreground))]">99.9%</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Uptime</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Real-time Data Active</span>
                </div>
                <button 
                  onClick={() => window.print()}
                  className="px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2 uppercase tracking-tighter text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Custom Confirmation Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">{modalConfig.title}</h3>
            <p className="text-slate-500 font-medium mb-8">{modalConfig.message}</p>
            
            {modalConfig.requireText && (
              <input 
                type="text"
                placeholder={`Type '${modalConfig.requireText}' to confirm`}
                className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-6 font-bold text-slate-900 dark:text-white"
                id="modal-confirm-input"
                autoFocus
              />
            )}

            <div className="flex gap-4">
              <button 
                onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all uppercase tracking-tighter"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (modalConfig.requireText) {
                    const input = document.getElementById('modal-confirm-input') as HTMLInputElement;
                    if (input?.value !== modalConfig.requireText) {
                      input.classList.add('border-red-500', 'animate-shake');
                      setTimeout(() => input.classList.remove('animate-shake'), 500);
                      return;
                    }
                  }
                  modalConfig.onConfirm();
                  setModalConfig({ ...modalConfig, isOpen: false });
                }}
                className={cn(
                  "flex-1 py-4 font-black rounded-2xl transition-all uppercase tracking-tighter shadow-xl",
                  modalConfig.type === 'danger' ? "bg-red-600 text-white hover:bg-red-700 shadow-red-600/20" : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                )}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Custom Alert/Toast */}
      {alertConfig.isOpen && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border font-bold",
              alertConfig.type === 'success' ? "bg-emerald-500 text-white border-emerald-400" : "bg-red-500 text-white border-red-400"
            )}
          >
            {alertConfig.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {alertConfig.message}
            <button onClick={() => setAlertConfig({ ...alertConfig, isOpen: false })} className="ml-4 p-1 hover:bg-white/20 rounded-lg transition-all">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
