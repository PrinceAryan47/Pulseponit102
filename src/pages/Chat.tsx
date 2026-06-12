import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { doc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Send, ArrowLeft, Phone, Video, MoreVertical, User, Paperclip, Smile, ShieldCheck, File, Image as ImageIcon, X, Mic, Square, Trash2, Bell, BellOff, Download, CornerUpLeft, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import GuestOverlay from '../components/GuestOverlay';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

// Voice note audio player component
const VoiceMessagePlayer: React.FC<{ src: string; duration?: number; isMeOnLayout: boolean }> = ({ src, duration, isMeOnLayout }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onLoadedMetadata = () => {
      if (audio.duration && audio.duration !== Infinity) {
        setAudioDuration(audio.duration);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      setIsPlaying(true);
    }
  };

  const formatSecs = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-2xl w-64 max-w-full",
      isMeOnLayout ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white"
    )}>
      <button 
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-neon-blue text-slate-900 flex items-center justify-center transition-all hover:scale-105 shadow shrink-0"
      >
        {isPlaying ? (
          <span className="w-3.5 h-3.5 flex gap-0.5 items-center justify-center">
            <span className="w-1 h-3 bg-slate-900 animate-pulse inline-block rounded-full"></span>
            <span className="w-1 h-3.5 bg-slate-900 animate-pulse inline-block rounded-full [animation-delay:0.2s]"></span>
            <span className="w-1 h-3 bg-slate-900 animate-pulse inline-block rounded-full [animation-delay:0.4s]"></span>
          </span>
        ) : (
          <Play className="w-4 h-4 text-slate-900 ml-0.5 fill-slate-900" />
        )}
      </button>

      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5Packed">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neon-blue">Voice Note</span>
          <span className="text-[10px] opacity-60 font-mono text-slate-400">{formatSecs(currentTime)} / {formatSecs(audioDuration || 0)}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-700/30 dark:bg-slate-600/30 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-neon-blue rounded-full"
            style={{ width: `${(currentTime / (audioDuration || 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

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

  // Mute Room State
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem(`muted_room_${roomId}`) === 'true';
  });

  // Permission Error State
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const toggleMute = () => {
    const nextVal = !isMuted;
    setIsMuted(nextVal);
    localStorage.setItem(`muted_room_${roomId}`, String(nextVal));
  };

  // Clear Chat History
  const handleClearChat = async () => {
    if (!roomId) return;
    if (!window.confirm("Are you sure you want to clear your chat history? This cannot be undone.")) return;
    try {
      const batch = writeBatch(db);
      messages.forEach(msg => {
        if (msg.id) {
          batch.update(doc(db, 'messages', msg.id), { hidden: true }); // Hide or delete depending on privacy
          // To strictly wipe out: batch.delete(doc(db, 'messages', msg.id));
          batch.delete(doc(db, 'messages', msg.id));
        }
      });
      await batch.commit();
      setMessages([]);
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  };

  // Export History
  const handleExportHistory = () => {
    if (messages.length === 0) {
      alert("No messages to export yet.");
      return;
    }
    const header = `# Voice & Consultation Record with ${otherUser?.fullName || 'Doctor'}\nRoom ID: ${roomId}\nExported: ${new Date().toLocaleString()}\n\n---\n\n`;
    const body = messages.map(msg => {
      const time = msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'yyyy-MM-dd HH:mm:ss') : 'Just now';
      return `**${msg.senderName}** [${time}]: ${msg.text || (msg.fileURL ? `[Attachment](${msg.fileURL})` : '')}`;
    }).join('\n\n');

    const blob = new Blob([header + body], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Medical_Chat_History_${(otherUser?.fullName || 'Consultation').replace(/\s+/g, '_')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Voice Note Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        if (audioChunksRef.current.length === 0) return;

        setUploadingFile(true);
        setUploadProgress(10);

        const sendVoiceAsBase64 = () => {
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const dataUrl = event.target?.result as string;
              if (dataUrl) {
                const messageData = {
                  roomId,
                  text: `🎙️ Voice Note (${recordingDuration}s)`,
                  voiceURL: dataUrl,
                  fileURL: dataUrl,
                  fileName: 'Voice Note',
                  fileType: 'audio/webm',
                  recordingDuration,
                  senderId: profile?.uid || user?.uid,
                  senderName: profile?.fullName || 'User',
                  timestamp: serverTimestamp(),
                  ...(replyToMessage && {
                    parentMessageId: replyToMessage.id || '',
                    parentMessageText: replyToMessage.text || 'File Attachment',
                    parentMessageSenderName: replyToMessage.senderName || '',
                  })
                };
                await addDoc(collection(db, 'messages'), messageData);
                socket?.emit('send-message', { ...messageData, timestamp: new Date().toISOString() });
              }
            } catch (err) {
              console.error("Failed to save base64 voice note:", err);
            } finally {
              setUploadingFile(false);
              setUploadProgress(0);
              setReplyToMessage(null);
            }
          };
          reader.onerror = (err) => {
            console.error("Reader error on audio fallback:", err);
            setUploadingFile(false);
            setUploadProgress(0);
          };
          reader.readAsDataURL(audioBlob);
        };

        try {
          const storageRef = ref(storage, `chats/${roomId}/${Date.now()}_voice.webm`);
          const uploadTask = uploadBytesResumable(storageRef, audioBlob);

          let uploadStalledTimeout = setTimeout(() => {
            console.warn("Audio storage upload stalled (timeout), cancelling and falling back to base64...");
            uploadTask.cancel();
          }, 2000);

          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              if (progress > 0) {
                clearTimeout(uploadStalledTimeout);
              }
              setUploadProgress(Math.max(10, progress));
            }, 
            (error) => {
              clearTimeout(uploadStalledTimeout);
              console.warn("Audio storage upload failed or cancelled, falling back to database transfer...", error);
              sendVoiceAsBase64();
            }, 
            async () => {
              clearTimeout(uploadStalledTimeout);
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const messageData = {
                  roomId,
                  text: `🎙️ Voice Note (${recordingDuration}s)`,
                  voiceURL: downloadURL,
                  fileURL: downloadURL,
                  fileName: 'Voice Note',
                  fileType: 'audio/webm',
                  recordingDuration,
                  senderId: profile?.uid || user?.uid,
                  senderName: profile?.fullName || 'User',
                  timestamp: serverTimestamp(),
                  ...(replyToMessage && {
                    parentMessageId: replyToMessage.id || '',
                    parentMessageText: replyToMessage.text || 'File Attachment',
                    parentMessageSenderName: replyToMessage.senderName || '',
                  })
                };

                await addDoc(collection(db, 'messages'), messageData);
                socket?.emit('send-message', { ...messageData, timestamp: new Date().toISOString() });
                setUploadingFile(false);
                setUploadProgress(0);
                setReplyToMessage(null);
              } catch (e) {
                console.warn("Storage upload completed but download URL retrieval failed, falling back:", e);
                sendVoiceAsBase64();
              }
            }
          );
        } catch (error) {
          console.warn("Audio save process error, using database fallback:", error);
          sendVoiceAsBase64();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Microphone setup failed:", error);
      setPermissionError("Missing microphone permission. If you are viewing this app inside the AI Studio frame, please open the application in a new tab using the 'Open in sub-window' icon at the top-right of your preview pane, then allow microphone access in your browser security prompt.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  // Reply to Message state
  const [replyToMessage, setReplyToMessage] = useState<any | null>(null);

  // Smooth scroll and flash background helper for quoted replies
  const scrollToMessage = (msgId: string) => {
    const targetEl = document.getElementById(`msg-${msgId}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetEl.classList.add('bg-neon-blue/10', 'rounded-2xl', 'p-2', 'transition-all', 'duration-500');
      setTimeout(() => {
        targetEl.classList.remove('bg-neon-blue/10', 'rounded-2xl', 'p-2');
      }, 2000);
    }
  };

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
      ...(replyToMessage && {
        parentMessageId: replyToMessage.id || '',
        parentMessageText: replyToMessage.text || 'File Attachment',
        parentMessageSenderName: replyToMessage.senderName || '',
      })
    };

    try {
      await addDoc(collection(db, 'messages'), messageData);
      socket?.emit('send-message', { ...messageData, timestamp: new Date().toISOString() });
      setNewMessage('');
      setShowEmojiPicker(false);
      setReplyToMessage(null);
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
    setUploadProgress(10); // Start progress bar

    const finalizeFileMessage = async (url: string, fileName: string, fileType: string) => {
      if (!profile) return;
      const messageData = {
        roomId,
        text: `Sent a file: ${fileName}`,
        fileURL: url,
        fileName: fileName,
        fileType: fileType,
        senderId: profile.uid,
        senderName: profile.fullName,
        timestamp: serverTimestamp(),
        ...(replyToMessage && {
          parentMessageId: replyToMessage.id || '',
          parentMessageText: replyToMessage.text || 'File Attachment',
          parentMessageSenderName: replyToMessage.senderName || '',
        })
      };

      await addDoc(collection(db, 'messages'), messageData);
      socket?.emit('send-message', { ...messageData, timestamp: new Date().toISOString() });
      setUploadingFile(false);
      setUploadProgress(0);
      setReplyToMessage(null);
    };

    const sendFileAsBase64 = (f: File) => {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
              await finalizeFileMessage(dataUrl, f.name, f.type);
            }
            resolve();
          } catch (err) {
            console.error("Error finalizing fallback message:", err);
            setUploadingFile(false);
            setUploadProgress(0);
            reject(err);
          }
        };
        reader.onerror = (err) => {
          setUploadingFile(false);
          setUploadProgress(0);
          reject(err);
        };
        reader.readAsDataURL(f);
      });
    };

    try {
      const storageRef = ref(storage, `chats/${roomId}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      let uploadStalledTimeout = setTimeout(() => {
        console.warn("File storage upload stalled (timeout), cancelling and falling back to base64...");
        uploadTask.cancel();
      }, 2000);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (progress > 0) {
            clearTimeout(uploadStalledTimeout);
          }
          setUploadProgress(Math.max(10, progress));
        }, 
        async (error) => {
          clearTimeout(uploadStalledTimeout);
          console.warn("Storage upload failed, attempting backend database fallback:", error);
          if (file.size > 800 * 1024) {
            alert(`File sharing failed. Firebase Storage is not enabled on your project, and this file (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the 800KB offline limit. Please compress or link a smaller file.`);
            setUploadingFile(false);
            setUploadProgress(0);
            return;
          }
          await sendFileAsBase64(file);
        }, 
        async () => {
          clearTimeout(uploadStalledTimeout);
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            await finalizeFileMessage(downloadURL, file.name, file.type);
          } catch (e) {
            console.warn("Failed to retrieve Storage URL, using database fallback:", e);
            await sendFileAsBase64(file);
          }
        }
      );
    } catch (err) {
      console.warn("Could not initiate Storage upload, using database fallback route:", err);
      if (file.size > 800 * 1024) {
        alert(`Storage is not configured or offline, and this file exceeds the 800KB database fallback limit.`);
        setUploadingFile(false);
        setUploadProgress(0);
        return;
      }
      await sendFileAsBase64(file);
    }
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
          
          {/* Mute Notification Toggle Button */}
          <button 
            onClick={toggleMute}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
              isMuted 
                ? "text-red-500 bg-red-500/10 hover:bg-red-500/20" 
                : "text-slate-600 dark:text-slate-400 hover:text-neon-blue hover:bg-neon-blue/10"
            )}
            title={isMuted ? "Unmute Notifications" : "Mute Notifications"}
          >
            {isMuted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </button>

          {/* Export Consultation History Button */}
          <button 
            onClick={handleExportHistory}
            className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-neon-blue hover:bg-neon-blue/10 rounded-xl transition-all"
            title="Export Consultation History"
          >
            <Download className="w-5 h-5" />
          </button>

          {/* Clear Current Room Chat Button */}
          <button 
            onClick={handleClearChat}
            className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
            title="Clear Chat History"
          >
            <Trash2 className="w-5 h-5" />
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
              id={`msg-${msg.id}`}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              drag="x"
              dragConstraints={{ left: 0, right: 100 }}
              dragElastic={0.4}
              onDragEnd={(event, info) => {
                if (info.offset.x > 60) {
                  setReplyToMessage(msg);
                }
              }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'} relative group cursor-grab active:cursor-grabbing selection:bg-none`}
            >
              {/* Swipe reply indicator hint */}
              <div className="absolute left-[-2.5rem] top-1/2 -translate-y-1/2 opacity-0 group-drag:opacity-30 pointer-events-none transition-opacity text-neon-blue">
                <CornerUpLeft className="w-5 h-5 rotate-180" />
              </div>

              <div className={`max-w-[80%] sm:max-w-[70%] group relative ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Quoted parent message header */}
                {msg.parentMessageId && (
                  <div 
                    onClick={() => scrollToMessage(msg.parentMessageId)}
                    className={cn(
                      "mb-1 px-3 py-1.5 bg-slate-950/5 dark:bg-slate-950/25 border-l-2 border-neon-blue/60 rounded-xl text-[11px] leading-relaxed cursor-pointer hover:bg-slate-950/15 max-w-full truncate text-left transition-all",
                      isMe ? "ml-auto text-right" : "mr-auto text-left"
                    )}
                  >
                    <p className="font-bold text-neon-blue/90 text-[10px] uppercase tracking-wider">Replying to @{msg.parentMessageSenderName}</p>
                    <p className="text-slate-500 dark:text-slate-400 truncate mt-0.5">{msg.parentMessageText}</p>
                  </div>
                )}

                <div className={`p-4 rounded-3xl shadow-lg relative ${
                  isMe 
                    ? 'bg-slate-900 dark:bg-slate-800 text-white rounded-tr-none border border-neon-blue/30 shadow-neon-blue/5' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'
                }`}>
                  {msg.voiceURL ? (
                    <VoiceMessagePlayer src={msg.voiceURL} duration={msg.recordingDuration} isMeOnLayout={isMe} />
                  ) : msg.fileURL ? (
                    <div className="space-y-2">
                      {msg.fileType?.startsWith('image/') ? (
                        <img 
                          src={msg.fileURL} 
                          alt={msg.fileName} 
                          className="max-w-full rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(msg.fileURL, '_blank')}
                        />
                      ) : msg.fileType?.startsWith('audio/') ? (
                        <VoiceMessagePlayer src={msg.fileURL} isMeOnLayout={isMe} />
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

                {/* Specific reply hover bubble icon for desktop/larger screens */}
                <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? '-left-12' : '-right-12'}`}>
                  <button 
                    onClick={() => setReplyToMessage(msg)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-405 hover:text-neon-blue rounded-full transition-all"
                    title="Reply to message"
                  >
                    <CornerUpLeft className="w-4 h-4" />
                  </button>
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

        {/* Dissmissable Reply Quote Preview */}
        <AnimatePresence>
          {replyToMessage && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-4xl mx-auto mb-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between"
            >
              <div className="flex items-start gap-2.5 min-w-0 pr-4">
                <div className="w-1 bg-neon-blue rounded-full self-stretch" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase text-neon-blue tracking-widest">Replying to @{replyToMessage.senderName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">{replyToMessage.text || "Multipart Attachment"}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setReplyToMessage(null)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Permission Error Banner */}
        <AnimatePresence>
          {permissionError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-4xl mx-auto mb-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-4 relative overflow-hidden"
            >
              <div className="p-2 bg-red-500/20 rounded-xl">
                <Mic className="w-5 h-5 text-red-500 shrink-0" />
              </div>
              <div className="flex-grow min-w-0 pr-6">
                <p className="text-sm font-bold text-red-500 mb-1">Microphone Access Blocked</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  {permissionError}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setPermissionError(null)}
                className="absolute top-4 right-4 p-1 hover:bg-red-500/10 rounded-full text-slate-400 hover:text-red-500 transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
            disabled={isRecording}
            className="p-3 text-slate-400 hover:text-neon-blue transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Paperclip className="w-6 h-6" />
          </button>

          {isRecording ? (
            <div className="flex-grow flex items-center justify-between px-6 py-3.5 bg-red-500/10 dark:bg-red-500/10 border border-red-500/30 rounded-[2rem] text-xs transition-all animate-pulse">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping shrink-0" />
                <span className="font-bold text-red-500 uppercase tracking-widest text-[10px]">Recording Voice Note</span>
                <span className="font-mono text-slate-500 dark:text-slate-400 font-bold pl-2 border-l border-slate-300 dark:border-slate-700">
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60) < 10 ? '0' : ''}{recordingDuration % 60}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={cancelRecording}
                  className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold uppercase tracking-wider text-[10px] transition-all shadow-md shrink-0"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Send Voice</span>
                </button>
              </div>
            </div>
          ) : (
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
          )}

          {newMessage.trim() === '' && !uploadingFile && !isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="w-14 h-14 flex items-center justify-center bg-neon-blue text-slate-900 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-neon-blue/20 neon-glow"
              title="Record Voice Note"
            >
              <Mic className="w-6 h-6 text-slate-900" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={(!newMessage.trim() && !isRecording) || uploadingFile}
              className="w-14 h-14 flex items-center justify-center bg-neon-blue text-slate-900 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-neon-blue/20 neon-glow disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
              <Send className="w-6 h-6 text-slate-900" />
            </button>
          )}

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
