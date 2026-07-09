import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Search, MessageSquare, ArrowRight, User, Stethoscope, ChevronRight, Users, Sparkles, CheckCircle, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import GuestOverlay from '../components/GuestOverlay';

interface ChatItem {
  id: string; // The user ID of the doctor or patient
  name: string;
  role: 'doctor' | 'patient';
  specialty?: string;
  photoURL?: string;
  isOnline?: boolean;
  roomId: string;
}

const Messages: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeChats, setActiveChats] = useState<ChatItem[]>([]);
  const [contacts, setContacts] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'directory'>('chats');

  useEffect(() => {
    if (!profile || !user) return;

    const currentUserId = user.uid || profile.uid;
    if (!currentUserId) return;

    const isPatient = profile.role === 'patient';
    const qField = isPatient ? 'patientId' : 'doctorId';

    // 1. Fetch appointments to identify active chat connections
    const qAppointments = query(
      collection(db, 'appointments'),
      where(qField, '==', currentUserId),
      orderBy('dateTime', 'desc'),
      limit(100)
    );

    // 2. Fetch potential chat contacts (Doctors if patient, Patients if doctor)
    const targetRole = isPatient ? 'doctor' : 'patient';
    const qUsers = query(
      collection(db, 'users'),
      where('role', '==', targetRole),
      limit(100)
    );

    let unsubUsers = () => {};
    let unsubAppointments = () => {};

    // Local registry of user profiles for reactive lookup and details correlation
    const usersMap = new Map<string, any>();
    let latestAppointmentsDocs: any[] = [];

    const updateCombinedState = () => {
      const activeIds = new Set<string>();
      const chatList: ChatItem[] = [];

      // Add users from appointments as active chats
      latestAppointmentsDocs.forEach(doc => {
        const data = doc.data();
        const otherId = isPatient ? data.doctorId : data.patientId;
        const otherName = isPatient ? (data.doctorName || 'Medical Specialist') : (data.patientName || 'Patient');

        if (otherId && !activeIds.has(otherId)) {
          activeIds.add(otherId);
          const userProfile = usersMap.get(otherId);
          chatList.push({
            id: otherId,
            name: userProfile?.fullName || otherName,
            role: targetRole,
            specialty: isPatient ? (userProfile?.specialization || data.doctorSpecialization || 'Specialist') : undefined,
            photoURL: userProfile?.photoURL,
            isOnline: userProfile?.isOnline || false,
            roomId: [currentUserId, otherId].sort().join('_'),
          });
        }
      });

      setActiveChats(chatList);

      // Remaining users who are not active chats go to the directory
      const directoryList: ChatItem[] = [];
      usersMap.forEach((u, uid) => {
        if (!activeIds.has(uid) && uid !== currentUserId) {
          directoryList.push({
            id: uid,
            name: u.fullName || 'User Account',
            role: targetRole,
            specialty: u.specialization,
            photoURL: u.photoURL,
            isOnline: u.isOnline || false,
            roomId: [currentUserId, uid].sort().join('_'),
          });
        }
      });
      setContacts(directoryList);
    };

    // Subscriptions
    unsubUsers = onSnapshot(qUsers, (usersSnap) => {
      usersMap.clear();
      usersSnap.docs.forEach(doc => {
        usersMap.set(doc.id, doc.data());
      });
      updateCombinedState();
    }, (error) => {
      console.error("Error fetching users for chat directory:", error);
    });

    unsubAppointments = onSnapshot(qAppointments, (appSnap) => {
      latestAppointmentsDocs = appSnap.docs;
      updateCombinedState();
      setLoading(false);
    }, (error) => {
      console.error("Error fetching appointments for active chats:", error);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubAppointments();
    };
  }, [profile, user]);

  const isPatient = profile?.role === 'patient';

  const displayedChats = activeChats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chat.specialty && chat.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const displayedDirectory = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.specialty && contact.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <GuestOverlay>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title & Navigation Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
              Medical <span className="text-primary">Consultations &amp; Chat</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {isPatient 
                ? "Send instant messages, medical files, and voice notes securely to your connected specialists."
                : "Manage patient queries, discuss clinical reports, and coordinate care plans privately."}
            </p>
          </div>
          
          {/* Real-time search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={activeTab === 'chats' ? "Search ongoing chats..." : "Search directories..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white font-semibold shadow-sm"
            />
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 dark:border-slate-900 mb-6 gap-2">
          <button
            onClick={() => { setActiveTab('chats'); setSearchTerm(''); }}
            className={`px-5 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'chats'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Active Chats ({activeChats.length})
          </button>
          <button
            onClick={() => { setActiveTab('directory'); setSearchTerm(''); }}
            className={`px-5 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'directory'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            {isPatient ? "Find Doctors Directory" : "Registered Patients Directory"} ({contacts.length})
          </button>
        </div>

        {/* main interactive listing panel */}
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-900 shadow-sm overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Loading chats and directories...</p>
            </div>
          ) : activeTab === 'chats' ? (
            displayedChats.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-900">
                {displayedChats.map((chat, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={chat.roomId}
                    onClick={() => navigate(`/chat/${chat.roomId}`)}
                    className="p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        {chat.photoURL ? (
                          <img 
                            src={chat.photoURL} 
                            alt={chat.name} 
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-800"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-primary/10 dark:bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 transition-transform group-hover:scale-105">
                            {chat.role === 'doctor' ? (
                              <Stethoscope className="w-6 h-6 text-primary" />
                            ) : (
                              <User className="w-6 h-6 text-primary" />
                            )}
                          </div>
                        )}
                        {chat.isOnline && (
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950 shadow-sm animate-pulse" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors text-base flex items-center gap-1.5">
                          {chat.role === 'doctor' ? `Dr. ${chat.name}` : chat.name}
                          {chat.role === 'doctor' && (
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-2 mt-1">
                          <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                          {chat.specialty ? `${chat.specialty} • ` : ''}Active Medical Chat
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hidden sm:inline-block">
                        Open Conversation
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-700 group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
                  <MessageSquare className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No Ongoing Conversations</h3>
                <p className="text-slate-400 dark:text-slate-500 max-w-sm text-sm font-semibold mb-6">
                  {isPatient
                    ? "Start a fresh secure chat from the Doctors directory tab or book a consultation appointment."
                    : "Wait for client bookings or open direct patient chat channels from the directory tab."}
                </p>
                <button 
                  onClick={() => setActiveTab('directory')}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-2xl text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
                >
                  Browse Directory
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )
          ) : (
            displayedDirectory.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-900">
                {displayedDirectory.map((contact, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={contact.id}
                    onClick={() => navigate(`/chat/${contact.roomId}`)}
                    className="p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        {contact.photoURL ? (
                          <img 
                            src={contact.photoURL} 
                            alt={contact.name} 
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-800"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-primary/10 dark:bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 transition-transform group-hover:scale-105">
                            {contact.role === 'doctor' ? (
                              <Stethoscope className="w-6 h-6 text-primary" />
                            ) : (
                              <User className="w-6 h-6 text-primary" />
                            )}
                          </div>
                        )}
                        {contact.isOnline && (
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950 shadow-sm animate-pulse" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors text-base flex items-center gap-1.5">
                          {contact.role === 'doctor' ? `Dr. ${contact.name}` : contact.name}
                          {contact.role === 'doctor' && (
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-2 mt-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          {contact.specialty ? `${contact.specialty} • ` : ''}Click to start direct messaging
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hidden sm:inline-block">
                        Start Messaging
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-700 group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
                  <HelpCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No Accounts Found</h3>
                <p className="text-slate-400 dark:text-slate-500 max-w-sm text-sm font-semibold">
                  We couldn't find any match in the medical directory directory. Try adjusting your search query.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </GuestOverlay>
  );
};

export default Messages;
