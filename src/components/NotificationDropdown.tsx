import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Bell, Check, Trash2, X, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const NotificationDropdown: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch notifications matching the user ID. We sort client-side to prevent Composite Index requirement failures.
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort client-side by createdAt (descending)
      data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });

      setNotifications(data);
    }, (error) => {
      console.error("Error subscribing to notifications:", error);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const clearAll = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit();
      setIsOpen(false);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'alert': return <AlertCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 text-slate-400 hover:text-neon-blue transition-colors relative rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800",
          isOpen && "text-neon-blue bg-neon-blue/10"
        )}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[rgb(var(--background))]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-[100]"
          >
            <div className="p-4 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-[rgb(var(--foreground))]">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs font-bold text-neon-blue hover:text-neon-blue-dark transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button 
                    onClick={clearAll}
                    className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-50 dark:divide-slate-700">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={cn(
                        "p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer relative group",
                        !n.read && "bg-neon-blue/5"
                      )}
                      onClick={() => markAsRead(n.id)}
                    >
                      <div className="flex gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          n.type === 'appointment' ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600" :
                          n.type === 'message' ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600" :
                          "bg-red-100 dark:bg-red-900/20 text-red-600"
                        )}>
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={cn("text-sm font-bold text-[rgb(var(--foreground))]", !n.read && "text-neon-blue")}>
                              {n.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                              {n.createdAt?.toDate ? format(n.createdAt.toDate(), 'MMM dd, HH:mm') : 'Just now'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      </div>
                      {!n.read && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-neon-blue rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No notifications yet</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-50 dark:border-slate-700 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  End of notifications
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
