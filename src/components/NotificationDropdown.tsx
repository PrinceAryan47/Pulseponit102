import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db, getFirebaseMessaging } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Bell, Check, Trash2, X, Calendar, MessageSquare, AlertCircle, Smartphone, CheckCircle, Eye, BellRing } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const NotificationDropdown: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<any | null>(null);
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPushStatus(Notification.permission as any);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch notifications matching the user ID. We sort client-side to prevent Composite Index requirement failures.
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    let isFirstLoad = true;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort client-side by createdAt (descending)
      data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });

      // Detect newly created unread notification for live feed alerts
      if (!isFirstLoad) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const addedDoc = { id: change.doc.id, ...change.doc.data() } as any;
            if (!addedDoc.read) {
              setActiveToast(addedDoc);
              
              // Native desktop browser notification
              if ('Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification(addedDoc.title, {
                    body: addedDoc.message,
                    icon: '/favicon.png'
                  });
                } catch (e) {
                  console.log("Desktop push failed in frame:", e);
                }
              }
            }
          }
        });
      }

      isFirstLoad = false;
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
      if (activeToast && activeToast.id === id) {
        setActiveToast(null);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert("This browser does not support desktop alerts.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);

      if (permission === 'granted') {
        const messaging = getFirebaseMessaging();
        if (messaging && user) {
          try {
            const { getToken } = await import('firebase/messaging');
            const token = await getToken(messaging, {
              vapidKey: 'BPr7C986U9G6tHe8fXy-LhL7N47W8_61U0e729_aX802424U8L'
            });
            if (token) {
              await updateDoc(doc(db, 'users', user.uid), {
                fcmToken: token,
                pushNotificationsEnabled: true
              });
            }
          } catch (tokenErr) {
            console.log("Standard browser FCM service token:", tokenErr);
          }
        }

        new Notification("PulsePoint Push Enabled", {
          body: "You will now receive desktop notifications for health reports and doctor sessions!",
          icon: '/favicon.png'
        });
      }
    } catch (err) {
      console.error("Error requesting browser push permissions:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
      setActiveToast(null);
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
      setActiveToast(null);
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
    <>
      {/* Sliding Client Push Notification Toast Alert */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -20 }}
            className="fixed top-18 right-4 z-[9999] w-full max-w-sm bg-slate-900/95 dark:bg-slate-950/95 text-white p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,243,255,0.15)] border border-neon-blue/30 backdrop-blur-md"
          >
            <div className="flex gap-3">
              <div className="w-9 h-9 bg-neon-blue/20 rounded-xl flex items-center justify-center text-neon-blue shrink-0">
                {getIcon(activeToast.type)}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="font-bold text-xs uppercase tracking-widest text-neon-blue">New Notification</h5>
                  <button 
                    onClick={() => setActiveToast(null)}
                    className="text-white/60 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="font-black text-sm text-white mt-1 select-none">{activeToast.title}</h4>
                <p className="text-xs text-white/80 mt-1 line-clamp-2 select-none leading-relaxed">{activeToast.message}</p>
                <div className="flex items-center gap-2 mt-3.5 pt-2 border-t border-white/10">
                  <button 
                    onClick={() => markAsRead(activeToast.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neon-blue text-slate-900 text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-neon-blue-dark transition-all"
                  >
                    <Check className="w-3 h-3" />
                    <span>Seen</span>
                  </button>
                  <button 
                    onClick={() => setActiveToast(null)}
                    className="px-2.5 py-1.5 hover:bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              {/* Push Notifications Opt-In Banner */}
              {pushStatus !== 'granted' && (
                <div className="p-3 bg-neon-blue/10 dark:bg-slate-950/40 border-b border-neon-blue/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[rgb(var(--foreground))] text-[10px] font-medium leading-tight">
                    <Smartphone className="w-4 h-4 text-neon-blue shrink-0 animate-bounce" />
                    <span>Enable Browser native push alerts?</span>
                  </div>
                  <button 
                    onClick={requestNotificationPermission}
                    className="px-2.5 py-1 bg-neon-blue text-slate-900 font-bold text-[9px] uppercase tracking-wider rounded-lg hover:bg-neon-blue-dark transition-colors"
                  >
                    Enable
                  </button>
                </div>
              )}

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

              <div className="max-h-[350px] overflow-y-auto no-scrollbar">
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
                            <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!n.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(n.id);
                                  }}
                                  className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-neon-blue hover:underline"
                                >
                                  <Eye className="w-3 h-3" />
                                  Mark Seen
                                </button>
                              )}
                            </div>
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
    </>
  );
};

export default NotificationDropdown;
