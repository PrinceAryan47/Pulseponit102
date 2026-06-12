import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Search, MessageSquare, ArrowRight, User, Stethoscope, ChevronRight, PhoneOff, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { safeFormat } from '../lib/dateUtils';
import GuestOverlay from '../components/GuestOverlay';

interface ChatItem {
  doctorId: string;
  doctorName: string;
  specialty?: string;
  roomId: string;
  lastMessageDate?: string;
  lastMessageText?: string;
}

const Messages: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!profile || !user) return;

    const currentUserId = user.uid || profile.uid;
    if (!currentUserId) return;

    // We fetch appointments for this patient to retrieve doctors they are connected with
    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', currentUserId),
      orderBy('dateTime', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const uniqueDoctors = new Map<string, ChatItem>();
      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.doctorId && !uniqueDoctors.has(data.doctorId)) {
          uniqueDoctors.set(data.doctorId, {
            doctorId: data.doctorId,
            doctorName: data.doctorName || 'Medical Specialist',
            roomId: [currentUserId, data.doctorId].sort().join('_'),
          });
        }
      });

      setChats(Array.from(uniqueDoctors.values()));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching chats from appointments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile, user]);

  const filteredChats = chats.filter(chat => 
    chat.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <GuestOverlay>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
              Inbox <span className="text-primary">&amp; Messages</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Consult with your medical practitioners and active specialists.
            </p>
          </div>
          
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white font-semibold"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-900 shadow-sm overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Loading chats...</p>
            </div>
          ) : filteredChats.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-900">
              {filteredChats.map((chat, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={chat.roomId}
                  onClick={() => navigate(`/chat/${chat.roomId}`)}
                  className="p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 dark:bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 transition-transform group-hover:scale-105 shrink-0">
                      <Stethoscope className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors text-base">
                        Dr. {chat.doctorName}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-2 mt-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Direct Consultation Room • Connected Partner
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hidden sm:inline-block">
                      Open Chat
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
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No Active Chat Sessions</h3>
              <p className="text-slate-400 dark:text-slate-500 max-w-sm text-sm font-semibold mb-6">
                You receive secure direct message access automatically with any doctor or specialist when booking or setting up consultations.
              </p>
              <button 
                onClick={() => navigate('/doctors')}
                className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-2xl text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
              >
                Find Medical Doctors
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </GuestOverlay>
  );
};

export default Messages;
