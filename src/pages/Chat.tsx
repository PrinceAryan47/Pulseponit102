import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { doc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Send, ArrowLeft, Phone, Video, MoreVertical, User, Paperclip, Smile, ShieldCheck, File, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import GuestOverlay from '../components/GuestOverlay';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const Chat: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const { socket, initiateCall } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isUserActive = (u: any) => {
    if (!u) return false;
    if (!u.isOnline) return false;
    if (!u.lastSeen) return false;
    const lastSeenDate = u.lastSeen.toDate ? u.lastSeen.toDate() : new Date(u.lastSeen);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeenDate > fiveMinutesAgo;
  };

  const getLastSeenText = (u: any) => {
    if (!u) return 'Offline';
    if (isUserActive(u)) return 'Online';
    if (!u.lastSeen) return 'Offline';
    try {
      const lastSeenDate = u.lastSeen.toDate ? u.lastSeen.toDate() : new Date(u.lastSeen);
      return `Last seen ${format(lastSeenDate, 'HH:mm')}`;
    } catch (e) {
      return 'Offline';
    }
  };

  useEffect(() => {
    if (!roomId || !user || !socket) return;

    socket.emit('join-room', roomId);

    const handleUserTyping = (data: any) => {
      if (data.roomId === roomId && data.userId !== user.uid) {
        setOtherUserTyping(data.isTyping);
      }
    };

    socket.on('user-typing', handleUserTyping);

    // Fetch other user info with real-time status
    let unsubscribeOtherUser: () => void = () => {};
    const fetchOtherUser = () => {
      const users = roomId.split('_');
      const otherUserId = users.find(id => id !== user.uid);
      if (otherUserId) {
        unsubscribeOtherUser = onSnapshot(doc(db, 'users', otherUserId), (doc) => {
          if (doc.exists()) {
            setOtherUser({ id: doc.id, ...doc.data() });
          }
        });
      }
    };
    fetchOtherUser();

    // Listen for messages in Firestore
    const q = query(
      collection(db, 'messages'),
      where('roomId', '==', roomId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => {
      socket.off('user-typing', handleUserTyping);
      unsubscribeMessages();
      unsubscribeOtherUser();
    };
  }, [roomId, user, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit('typing', { roomId, userId: user?.uid, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('typing', { roomId, userId: user?.uid, isTyping: false });
    }, 3000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId || !profile) return;

    // Stop typing indicator
    setIsTyping(false);
    socket?.emit('typing', { roomId, userId: user?.uid, isTyping: false });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const messageData = {
      roomId,
      text: newMessage,
      senderId: profile.uid,
      senderName: profile.fullName,
      timestamp: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'messages'), messageData);
      socket?.emit('send-message', { ...messageData, timestamp: new Date().toISOString() });
      setNewMessage('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const onEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !roomId || !profile) return;

    setUploadingFile(true);
    const storageRef = ref(storage, `chats/${roomId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error("Upload error:", error);
        setUploadingFile(false);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const messageData = {
          roomId,
          text: `Sent a file: ${file.name}`,
          fileURL: downloadURL,
          fileName: file.name,
          fileType: file.type,
          senderId: profile.uid,
          senderName: profile.fullName,
          timestamp: serverTimestamp(),
        };

        await addDoc(collection(db, 'messages'), messageData);
        socket?.emit('send-message', { ...messageData, timestamp: new Date().toISOString() });
        setUploadingFile(false);
        setUploadProgress(0);
      }
    );
  };

  return (
    <GuestOverlay
      title="Secure Messaging"
      description="Sign in to chat with your doctors and manage your medical consultations privately."
    >
      <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300f3ff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>

        {/* Chat Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              {otherUser?.photoURL ? (
                <img src={otherUser.photoURL} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-neon-blue/20" />
              ) : (
                <div className="w-12 h-12 bg-neon-blue/10 rounded-2xl flex items-center justify-center border-2 border-neon-blue/20">
                  <User className="w-7 h-7 text-neon-blue" />
                </div>
              )}
              <span className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white dark:border-slate-800 rounded-full",
                isUserActive(otherUser) ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-400"
              )}></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-slate-800 dark:text-white tracking-tight">{otherUser?.fullName || 'Loading...'}</h2>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-neon-blue/10 rounded text-[8px] font-black text-neon-blue uppercase tracking-widest border border-neon-blue/20">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Verified
                </div>
              </div>
              <div className="flex items-center gap-2 h-4">
                {otherUserTyping ? (
                  <p className="text-[10px] text-neon-blue font-black animate-pulse uppercase tracking-widest">Typing...</p>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      isUserActive(otherUser) ? "text-emerald-500" : "text-slate-500"
                    )}>
                      {getLastSeenText(otherUser)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 mr-4 px-3 py-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-full border border-slate-200 dark:border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">End-to-End Encrypted</span>
          </div>
          <button 
            onClick={() => {
              if (!user || !profile || !otherUser) return;
              initiateCall(otherUser.id, otherUser.fullName, otherUser.photoURL || '', 'audio', roomId);
            }}
            className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-neon-blue hover:bg-neon-blue/10 rounded-xl transition-all"
            title="Voice Call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              if (!user || !profile || !otherUser) return;
              initiateCall(otherUser.id, otherUser.fullName, otherUser.photoURL || '', 'video', roomId);
            }}
            className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-neon-blue hover:bg-neon-blue/10 rounded-xl transition-all"
            title="Video Call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6 no-scrollbar z-10">
        <div className="flex justify-center mb-8">
          <div className="bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-slate-300/30 dark:border-slate-700/30">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">End-to-End Encrypted</p>
          </div>
        </div>

        {messages.map((msg, idx) => {
          const isMe = profile ? msg.senderId === profile.uid : false;
          return (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] sm:max-w-[70%] group relative ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-3xl shadow-lg ${
                  isMe 
                    ? 'bg-slate-900 dark:bg-slate-800 text-white rounded-tr-none border border-neon-blue/30 shadow-neon-blue/5' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'
                }`}>
                  {msg.fileURL ? (
                    <div className="space-y-2">
                      {msg.fileType?.startsWith('image/') ? (
                        <img 
                          src={msg.fileURL} 
                          alt={msg.fileName} 
                          className="max-w-full rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(msg.fileURL, '_blank')}
                        />
                      ) : (
                        <a 
                          href={msg.fileURL} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-900/50 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-900 transition-all"
                        >
                          <div className="w-10 h-10 bg-neon-blue/10 rounded-xl flex items-center justify-center">
                            <File className="w-5 h-5 text-neon-blue" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-bold truncate">{msg.fileName}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Download File</p>
                          </div>
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-[15px] leading-relaxed font-medium">{msg.text}</p>
                  )}
                  <div className={`flex items-center gap-2 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isMe ? 'text-neon-blue/70' : 'text-slate-400'}`}>
                      {msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'HH:mm') : 'Sending...'}
                    </p>
                    {isMe && <ShieldCheck className="w-3 h-3 text-neon-blue/50" />}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 z-10">
        {uploadingFile && (
          <div className="max-w-4xl mx-auto mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-neon-blue uppercase tracking-widest">Uploading File...</p>
              <p className="text-xs font-bold text-neon-blue">{Math.round(uploadProgress)}%</p>
            </div>
            <div className="w-full h-1 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-neon-blue"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3 relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-neon-blue transition-colors"
          >
            <Paperclip className="w-6 h-6" />
          </button>
          <div className="flex-grow relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type a message..."
              className="w-full pl-6 pr-12 py-4 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-[2rem] focus:ring-2 focus:ring-neon-blue outline-none transition-all text-slate-800 dark:text-white font-medium"
            />
            <button 
              type="button" 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 transition-colors",
                showEmojiPicker ? "text-neon-blue" : "text-slate-400 hover:text-neon-blue"
              )}
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || uploadingFile}
            className="w-14 h-14 flex items-center justify-center bg-neon-blue text-slate-900 rounded-full font-bold hover:bg-neon-blue-dark transition-all shadow-xl shadow-neon-blue/20 neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-6 h-6" />
          </button>

          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full right-0 mb-4 z-50"
              >
                <div className="relative">
                  <button 
                    onClick={() => setShowEmojiPicker(false)}
                    className="absolute -top-4 -right-4 w-8 h-8 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-500 z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <EmojiPicker 
                    onEmojiClick={onEmojiClick}
                    theme={EmojiTheme.AUTO}
                    lazyLoadEmojis={true}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
      </div>
    </GuestOverlay>
  );
};

export default Chat;
