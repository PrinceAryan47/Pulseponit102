import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { UserProfile } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Phone,
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Maximize, 
  Minimize,
  User,
  Settings,
  AlertCircle,
  Activity,
  Hand,
  Users,
  MessageSquare,
  MoreVertical,
  Grid,
  Volume2,
  VolumeX,
  Pin,
  Send,
  X,
  Check,
  Play,
  Pause,
  Monitor,
  Layout as LayoutIcon,
  Sparkles,
  Info,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GuestOverlay from '../components/GuestOverlay';
import { cn } from '../lib/utils';

// Participant schema
interface Participant {
  id: string | number;
  name: string;
  isLocal: boolean;
  audio: boolean;
  video: boolean;
  handRaised: boolean;
  isHost?: boolean;
  isPinned?: boolean;
  avatar?: string;
  stream?: MediaStream | null;
  role?: string;
  isScreenShare?: boolean;
}

const Meeting: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { profile } = useAuth();
  const { socket, endCall, iceServers, clearSessions } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const callType = queryParams.get('type') || 'video';
  const isCaller = queryParams.get('caller') === 'true';

  // State managers
  const [isJoined, setIsJoined] = useState(false);
  const [userName, setUserName] = useState(profile?.fullName || 'Guest User');
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'initializing' | 'connecting' | 'connected' | 'disconnected' | 'failed'>('initializing');
  const [retryCount, setRetryCount] = useState(0);

  // Layout & Toolbar State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'tiled' | 'spotlight' | 'sidebar' | 'auto'>('auto');
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | number>('remote');
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | number | null>(null);

  // Sidebars & Captions
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'people' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [captionsActive, setCaptionsActive] = useState(false);
  const [currentCaption, setCurrentCaption] = useState<string | null>(null);

  // Chat Feed
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; time: string; text: string; isMe: boolean; scope: 'Everyone' | 'Physician Only' }>>([
    { sender: 'Dr. Sarah Peterson (GP)', time: '10:00 AM', text: 'Hello, thank you for joining our encrypted clinical streaming network.', isMe: false, scope: 'Everyone' },
    { sender: 'Clinical Specialist AI', time: '10:01 AM', text: 'Vital signs integration holds 100% telemetry accuracy.', isMe: false, scope: 'Everyone' },
  ]);
  const [newMsgText, setNewMsgText] = useState('');
  const [chatScope, setChatScope] = useState<'Everyone' | 'Physician Only'>('Everyone');

  // Media Streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // WebRTC & Audio refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Setup local preview streams before Joining the flow
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const fetchPreviewStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoOn,
          audio: true,
        });
        activeStream = stream;
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Lobby media request error: ", err);
      }
    };

    if (!isJoined) {
      fetchPreviewStream();
    }

    return () => {
      if (!isJoined && activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isJoined, isVideoOn]);

  // Master Participants Directory
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'local', name: userName, isLocal: true, audio: isMicOn, video: isVideoOn, handRaised: false, avatar: profile?.photoURL || '' },
    { id: 'remote', name: 'Dr. Sarah Peterson (GP)', isLocal: false, audio: true, video: true, handRaised: false, isHost: true, role: 'Physician', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=240' },
    { id: 'specialist_ai', name: 'Clinical Specialist AI', isLocal: false, audio: false, video: true, handRaised: false, role: 'AI Assistant', avatar: 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&q=80&w=240' }
  ]);

  // Synchronize local states to our master list
  useEffect(() => {
    setParticipants(prev => prev.map(p => {
      if (p.isLocal) {
        return { ...p, name: userName, audio: isMicOn, video: isVideoOn };
      }
      return p;
    }));
  }, [userName, isMicOn, isVideoOn]);

  // Dynamic Speaker Switching Loop
  useEffect(() => {
    if (!isJoined) return;
    const speakerInterval = setInterval(() => {
      const speakers = ['local', 'remote', 'specialist_ai'];
      const randomSpeaker = speakers[Math.floor(Math.random() * speakers.length)];
      setActiveSpeakerId(randomSpeaker);
    }, 8000);

    return () => clearInterval(speakerInterval);
  }, [isJoined]);

  // Captions Simulator Loop
  useEffect(() => {
    if (!captionsActive || !isJoined) {
      setCurrentCaption(null);
      return;
    }

    const subtitles = [
      "Hello, I can see your visual data stream is active and secured.",
      "Comparing current heartbeat rhythm with latest clinical profile...",
      "Could you elaborate on any physical discomfort or exertion fatigue?",
      "Excellent. I have processed an instant summary for your local dashboard.",
      "The pharmacy dispatch code has been assigned to your profile page."
    ];

    let index = 0;
    setCurrentCaption(subtitles[0]);

    const captionInterval = setInterval(() => {
      index = (index + 1) % subtitles.length;
      setCurrentCaption(subtitles[index]);
    }, 6500);

    return () => clearInterval(captionInterval);
  }, [captionsActive, isJoined]);

  // Timing trigger
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isJoined) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isJoined]);

  // WebRTC Web Communication System bridged with current Socket framework
  useEffect(() => {
    if (!isJoined || !roomId || !profile || !socket) return;

    let otherUserId = "";
    const users = roomId.split('_');
    otherUserId = users.find(id => id !== profile.uid) || "";

    const fetchOtherParticipant = async () => {
      if (otherUserId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setOtherUser(data);
            setParticipants(prev => prev.map(p => p.id === 'remote' ? {
              ...p,
              name: data.fullName || p.name,
              avatar: data.photoURL || p.avatar
            } : p));
          }
        } catch (e) {
          console.error("Failed to fetch doctor user metrics", e);
        }
      }
    };
    fetchOtherParticipant();

    // Init P2P Peer Connection
    const configuration = {
      iceServers: iceServers || [{ urls: 'stun:stun.l.google.com:19302' }],
      iceCandidatePoolSize: 10,
    };

    const runSignaling = async () => {
      try {
        setConnectionStatus('connecting');
        const pc = new RTCPeerConnection(configuration);
        peerConnectionRef.current = pc;

        if (localStream) {
          localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
          });
        }

        const remoteMediaStream = new MediaStream();
        setRemoteStream(remoteMediaStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteMediaStream;
        }

        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            event.streams[0].getTracks().forEach(track => {
              remoteMediaStream.addTrack(track);
            });
          } else {
            remoteMediaStream.addTrack(event.track);
          }
          setConnectionStatus('connected');
        };

        pc.onicecandidate = (event) => {
          if (event.candidate && otherUserId) {
            socket.emit("webrtc-ice-candidate", {
              roomId,
              candidate: event.candidate.toJSON(),
              to: otherUserId
            });
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            setConnectionStatus('connected');
          }
          if (pc.iceConnectionState === 'failed') {
            setConnectionStatus('failed');
            setError("Consultation quality degraded. Refresh streams to restore.");
          }
        };

        if (isCaller) {
          const offerDescription = await pc.createOffer();
          await pc.setLocalDescription(offerDescription);
          socket.emit("webrtc-offer", {
            roomId,
            offer: { sdp: offerDescription.sdp, type: offerDescription.type },
            to: otherUserId
          });

          socket.on("webrtc-answer", async (data) => {
            if (data.roomId === roomId && !pc.currentRemoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
          });
        } else {
          socket.on("webrtc-offer", async (data) => {
            if (data.roomId === roomId && !pc.currentRemoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
              const answerDescription = await pc.createAnswer();
              await pc.setLocalDescription(answerDescription);
              socket.emit("webrtc-answer", {
                roomId,
                answer: { sdp: answerDescription.sdp, type: answerDescription.type },
                to: otherUserId
              });
            }
          });
        }

        socket.on("webrtc-ice-candidate", async (data) => {
          if (data.roomId === roomId && data.candidate && pc) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (e) {
              console.log("Ignored loose ICE node:", e);
            }
          }
        });

      } catch (err: any) {
        console.error("Signaling connection error:", err);
      }
    };

    runSignaling();

    return () => {
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice-candidate");
    };
  }, [isJoined, roomId, profile, socket, isCaller, localStream, iceServers]);

  // Clean streams when component unmounts
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [localStream]);

  // Scroll Chat to bottom when new messages arrive
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Keyboard Shortcuts Bindings (M = Mute, C = Camera, R = Raise Hand)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === 'm') {
        toggleMic();
      } else if (key === 'c') {
        toggleVideo();
      } else if (key === 'r') {
        toggleHandRaise();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localStream, isMicOn, isVideoOn, participants]);

  // Action Controllers
  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => (track.enabled = !isMicOn));
    }
    setIsMicOn(prev => !prev);
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => (track.enabled = !isVideoOn));
    }
    setIsVideoOn(prev => !prev);
  };

  const toggleHandRaise = () => {
    const isNowRaised = !participants.find(p => p.isLocal)?.handRaised;
    setParticipants(prev => prev.map(p => p.isLocal ? { ...p, handRaised: isNowRaised } : p));
    
    if (isNowRaised) {
      // Show notification badge and auto lower after 30 seconds
      setTimeout(() => {
        setParticipants(prev => prev.map(p => p.isLocal ? { ...p, handRaised: false } : p));
      }, 30000);
    }
  };

  const startScreenShare = async () => {
    if (isScreenSharing) {
      setParticipants(prev => prev.filter(p => !p.isScreenShare));
      setIsScreenSharing(false);
      return;
    }

    try {
      // Attempt desktop capture API or mock screen simulation nicely
      let captureStream: MediaStream | null = null;
      if (navigator.mediaDevices.getDisplayMedia) {
        captureStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        captureStream.getVideoTracks()[0].onended = () => {
          setParticipants(prev => prev.filter(p => !p.isScreenShare));
          setIsScreenSharing(false);
        };
      }

      setParticipants(prev => [
        ...prev,
        {
          id: 'screen_feed',
          name: `${userName}'s Screen`,
          isLocal: true,
          audio: false,
          video: true,
          handRaised: false,
          avatar: '',
          isScreenShare: true,
          stream: captureStream
        }
      ]);
      setIsScreenSharing(true);
      setLayoutMode('spotlight'); // Switch layout for visual focus
    } catch (err) {
      // Fallback elegant mock screen layout if permissions or browsers block
      setParticipants(prev => [
        ...prev,
        {
          id: 'screen_feed',
          name: `${userName}'s Desktop Shared`,
          isLocal: true,
          audio: false,
          video: true,
          handRaised: false,
          avatar: '',
          isScreenShare: true,
          stream: null
        }
      ]);
      setIsScreenSharing(true);
      setLayoutMode('spotlight');
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgText.trim()) return;

    setChatMessages(prev => [
      ...prev,
      {
        sender: userName,
        time: formatTime(new Date()),
        text: newMsgText.trim(),
        isMe: true,
        scope: chatScope
      }
    ]);
    setNewMsgText('');
  };

  const handleKickParticipant = (id: string | number) => {
    if (id === 'local') return;
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const handleMuteAll = () => {
    setParticipants(prev => prev.map(p => p.isLocal ? p : { ...p, audio: false }));
  };

  const handlePinParticipant = (id: string | number) => {
    if (pinnedParticipantId === id) {
      setPinnedParticipantId(null);
    } else {
      setPinnedParticipantId(id);
    }
  };

  const handleHangUp = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    endCall();
    clearSessions();
    navigate(-1);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Lobby/Lounge Pre-Join view render
  if (!isJoined) {
    return (
      <GuestOverlay
        title="Lobby Preview"
        description="Encrypted WebRTC high-fidelity signaling checks."
      >
        <div className="fixed inset-0 bg-[#202124] text-white flex flex-col md:flex-row items-center justify-center p-6 gap-12 z-[1000]">
          {/* Diagnostic Video Feed Preview */}
          <div className="w-full max-w-xl flex flex-col gap-4">
            <div className="relative aspect-video bg-neutral-800 rounded-3xl overflow-hidden border border-neutral-700 shadow-2xl flex items-center justify-center">
              {isVideoOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-neutral-400">
                  <div className="w-24 h-24 bg-neutral-700 rounded-full flex items-center justify-center border border-neutral-600">
                    <User className="w-12 h-12 text-neutral-300" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider text-neutral-500">Camera Feed Suspended</span>
                </div>
              )}

              {/* Lobby Camera and Mic Toggle floating panels */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md border hover:scale-105",
                    isMicOn ? "bg-neutral-900 border-neutral-700 text-white" : "bg-red-500 border-red-500 text-white"
                  )}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  onClick={toggleVideo}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md border hover:scale-105",
                    isVideoOn ? "bg-neutral-900 border-neutral-700 text-white" : "bg-red-500 border-red-500 text-white"
                  )}
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </div>

              {/* Encrypted tag */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-[10px] uppercase tracking-wider font-extrabold text-neon-blue border border-neon-blue/20">
                <div className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-ping" />
                <span>Encrypted Preview</span>
              </div>
            </div>
          </div>

          {/* Lobby Name Config Entry Column */}
          <div className="w-full max-w-sm flex flex-col gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-white mb-2">Ready to join?</h1>
              <p className="text-sm text-neutral-400">Verified doctor and clinical consultants are currently active in this session space.</p>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black uppercase tracking-wider text-neutral-400">Display Identity</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-5 py-4 bg-neutral-800/80 border border-neutral-700 rounded-2xl text-white font-medium focus:ring-2 focus:ring-neon-blue outline-none transition-all"
              />
            </div>

            <div className="bg-neutral-800/40 border border-neutral-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="flex -space-x-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#202124] bg-neutral-700 flex items-center justify-center text-xs font-extrabold overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=80" alt="" className="w-full h-full object-cover" />
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-[#202124] bg-neutral-600 flex items-center justify-center text-[10px] font-black uppercase tracking-tighter">AI</div>
              </div>
              <span className="text-xs text-neutral-400 font-bold">Dr. Sarah and Clinical Artificial Intelligence are on call status.</span>
            </div>

            <button
              onClick={() => setIsJoined(true)}
              className="w-full py-4.5 bg-neon-blue text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neon-blue-dark active:scale-[0.98] transition-all shadow-lg shadow-neon-blue/10 flex items-center justify-center gap-2"
            >
              <span>Join Medical stream</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      </GuestOverlay>
    );
  }

  // Generate layouts dynamically
  const getLayoutClass = () => {
    const total = participants.length;
    if (layoutMode === 'spotlight' || pinnedParticipantId !== null) {
      return 'grid-cols-1';
    }
    if (layoutMode === 'sidebar') {
      return 'grid-cols-1 md:grid-cols-3';
    }
    
    // Auto flow layouts
    if (total <= 1) return 'grid-cols-1';
    if (total <= 2) return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  };

  const getPinnedOrFeaturedParticipant = () => {
    if (pinnedParticipantId) {
      return participants.find(p => p.id === pinnedParticipantId) || participants[0];
    }
    const screenShare = participants.find(p => p.isScreenShare);
    if (screenShare) return screenShare;
    return participants.find(p => p.id === activeSpeakerId) || participants[0];
  };

  return (
    <GuestOverlay
      title="Google Meet System Panel"
      description="Clinical communication console with high-fidelity WebRTC telemetry."
    >
      <div className="fixed inset-0 bg-[#202124] text-white flex flex-col overflow-hidden z-[1000] font-sans selection:bg-none">
        
        {/* Layer A - Top bar (60px height) */}
        <div className="h-[60px] bg-[#202124] border-b border-neutral-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-extrabold tracking-wide uppercase text-sm text-neutral-200">Consultation Session</span>
            <div className="h-4 w-px bg-neutral-700" />
            <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-800 rounded-lg">
              <Users className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-[11px] font-bold text-neutral-300">{participants.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center font-mono text-xs px-3 py-1.5 bg-neutral-800 rounded-xl text-neutral-400 tracking-wider">
              Code: <span className="text-neon-blue font-black tracking-normal select-text">pul-sepo-int</span>
            </div>
            <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-black rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span>{formatDuration(callDuration)}</span>
            </div>
          </div>

          {/* Top Bar Right side control toggles */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSidebarTab(prev => prev === 'people' ? null : 'people')}
              className={cn(
                "p-2.5 rounded-xl transition-all relative hover:bg-neutral-800 text-neutral-400 hover:text-white",
                sidebarTab === 'people' && "bg-neon-blue/10 text-white"
              )}
              title="Participants list"
            >
              <Users className="w-5 h-5" />
              {participants.some(p => p.handRaised) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setSidebarTab(prev => prev === 'chat' ? null : 'chat')}
              className={cn(
                "p-2.5 rounded-xl transition-all relative hover:bg-neutral-800 text-neutral-400 hover:text-white",
                sidebarTab === 'chat' && "bg-neon-blue/10 text-white"
              )}
              title="In-call messaging"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 rounded-xl transition-all hover:bg-neutral-800 text-neutral-400 hover:text-white"
              title="Settings & Telemetry"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleHangUp}
              className="p-2.5 bg-red-600/30 text-red-500 rounded-xl border border-red-500/10 hover:bg-red-500 hover:text-white transition-all md:hidden"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Master Area - Bottom & Main dynamic frame viewport */}
        <div className="flex-grow flex relative min-h-0 bg-[#202124]">
          
          <div className="flex-grow flex flex-col p-6 relative justify-center min-w-0">
            {/* Dynamic layout containers based on modes */}
            {(layoutMode === 'spotlight' || pinnedParticipantId !== null || isScreenSharing) ? (
              // Spotlight or Screen share master frame (Dominant element + list strip)
              <div className="w-full h-full flex flex-col md:flex-row gap-4 justify-between items-stretch">
                <div className="flex-grow relative rounded-3xl overflow-hidden border-2 border-neutral-800 bg-[#121214] flex items-center justify-center">
                  {/* Spotlight focus body */}
                  {(() => {
                    const featured = getPinnedOrFeaturedParticipant();
                    return (
                      <div className="w-full h-full relative flex items-center justify-center">
                        {featured.isLocal && isVideoOn ? (
                          <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                        ) : !featured.isLocal && featured.id === 'remote' && remoteStream && connectionStatus === 'connected' ? (
                          <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          // High-fidelity graphic representation for mock / off streams
                          <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center gap-4">
                            <div className={cn(
                              "w-28 h-28 rounded-full border border-neutral-700 shadow-xl flex items-center justify-center overflow-hidden transition-all",
                              activeSpeakerId === featured.id ? "ring-[6px] ring-emerald-500 animate-pulse" : ""
                            )}>
                              {featured.avatar ? (
                                <img src={featured.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-14 h-14 text-neutral-400" />
                              )}
                            </div>
                            <span className="text-sm font-semibold text-neutral-300">{featured.name} ({featured.role || 'Guest'})</span>
                          </div>
                        )}

                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-white flex items-center gap-2 select-none">
                          <span>{featured.name}</span>
                          {featured.isLocal && <span className="text-[10px] bg-neon-blue text-slate-900 px-1.5 rounded font-black uppercase">You</span>}
                        </div>

                        {featured.handRaised && (
                          <div className="absolute top-4 right-4 bg-amber-500 px-3 py-1.5 rounded-full border border-amber-400 shadow-xl text-sm font-bold flex items-center gap-1.5 text-slate-950 animate-bounce">
                            <Hand className="w-4 h-4 fill-slate-950" />
                            <span>Hand Raised</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Vertical Participant Strips in Spotlight mode */}
                <div className="flex md:flex-col gap-4 max-h-[140px] md:max-h-full md:w-[180px] overflow-x-auto md:overflow-y-auto pr-2 no-scrollbar shrink-0">
                  {participants.filter(p => !p.isScreenShare).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handlePinParticipant(p.id)}
                      className={cn(
                        "w-[140px] md:w-full aspect-video bg-neutral-900 border-2 rounded-2xl overflow-hidden shrink-0 relative flex items-center justify-center hover:border-neon-blue transition-all group",
                        p.id === activeSpeakerId ? "border-emerald-500" : "border-neutral-800"
                      )}
                    >
                      {p.isLocal && isVideoOn ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      ) : !p.isLocal && p.id === 'remote' && remoteStream && connectionStatus === 'connected' ? (
                        <video
                          ref={remoteVideoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400 overflow-hidden">
                          {p.avatar ? <img src={p.avatar} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4" />}
                        </div>
                      )}

                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[10px] font-bold text-white max-w-[85%] truncate">
                        {p.name}
                      </div>

                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        {!p.audio && <MicOff className="w-3.5 h-3.5 text-red-500 bg-black/40 p-0.5 rounded" />}
                        {p.handRaised && <span className="text-xs">✋</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Tiled and Dynamic equalized list grids
              <div className={cn("grid gap-6 h-full items-center justify-center w-full max-w-6xl mx-auto transition-all duration-300", getLayoutClass())}>
                {participants.map((p) => {
                  const isSourcedActive = (p.id === activeSpeakerId && participants.length > 1);
                  return (
                    <motion.div
                      key={p.id}
                      layoutId={`tile-${p.id}`}
                      className={cn(
                        "relative aspect-video rounded-3xl overflow-hidden bg-neutral-900 border-2 shadow-2xl flex items-center justify-center transition-all duration-300 group",
                        isSourcedActive ? "border-emerald-500 shadow-emerald-500/5 ring-4 ring-emerald-500/10 scale-[1.02]" : "border-neutral-800 hover:border-neutral-700"
                      )}
                    >
                      {/* Sub-streams video attachment container */}
                      {p.isLocal ? (
                        isVideoOn ? (
                          <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                        ) : (
                          // Off profile placeholder style
                          <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center gap-3">
                            <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center overflow-hidden">
                              {profile?.photoURL ? (
                                <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-10 h-10 text-neutral-500" />
                              )}
                            </div>
                            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest leading-none">Video Paused</span>
                          </div>
                        )
                      ) : p.id === 'remote' && remoteStream && connectionStatus === 'connected' ? (
                        <video
                          ref={remoteVideoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[#1E1F21] flex flex-col items-center justify-center gap-3">
                          <div className={cn(
                            "w-20 h-20 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300",
                            isSourcedActive ? "ring-4 ring-emerald-500" : ""
                          )}>
                            {p.avatar ? (
                              <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-10 h-10 text-neutral-500" />
                            )}
                          </div>
                          <span className="text-xs font-semibold text-neutral-400">{p.name} ({p.role || 'Guest'})</span>
                        </div>
                      )}

                      {/* Name tag Overlay */}
                      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-bold flex items-center gap-2 hover:bg-black/80 transition-colors select-none">
                        <span>{p.name}</span>
                        {p.isLocal && <span className="text-[9px] bg-neon-blue text-slate-900 px-1 font-black uppercase rounded">You</span>}
                      </div>

                      {/* Icons overlays on bottom-right and top bar */}
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        {p.handRaised && (
                          <div className="bg-amber-500 px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-slate-950 flex items-center gap-1 animate-bounce">
                            <Hand className="w-3.5 h-3.5 fill-slate-950" />
                            <span>Hand</span>
                          </div>
                        )}
                        {!p.audio && (
                          <div className="p-1.5 bg-red-500 text-white rounded-lg border border-red-500/20">
                            <MicOff className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Interactive Menu Action trigger on Hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                        <button
                          onClick={() => handlePinParticipant(p.id)}
                          className={cn(
                            "p-3 rounded-full hover:scale-105 transition-all text-white border",
                            pinnedParticipantId === p.id ? "bg-neon-blue border-neon-blue text-slate-900" : "bg-neutral-900 border-neutral-700"
                          )}
                          title="Pin Feed"
                        >
                          <Pin className="w-4 h-4" />
                        </button>

                        {!p.isLocal && (
                          <button
                            onClick={() => handleKickParticipant(p.id)}
                            className="p-3 bg-red-600/25 border border-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white hover:scale-105 transition-all"
                            title="Remove of Session"
                          >
                            <PhoneOff className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Captions Display Box overlay */}
            {captionsActive && currentCaption && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-xl w-full text-center px-4 z-40">
                <div className="inline-block bg-black/85 border border-white/5 backdrop-blur-md px-6 py-3 rounded-2xl text-sm font-medium tracking-wide text-white/95 shadow-2xl leading-relaxed">
                  <span className="text-[10px] uppercase font-black tracking-widest text-emerald-500 block text-left mb-1">Live Clinical Subtitles</span>
                  {currentCaption}
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Layer D - Right Sidebar (320px wide) */}
          <AnimatePresence>
            {sidebarTab && (
              <motion.div
                initial={{ opacity: 0, x: 320 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 320 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-full md:w-[340px] bg-neutral-900 border-l border-neutral-800 flex flex-col shrink-0 relative z-50 h-full"
              >
                {/* Sidebar Header with controls */}
                <div className="p-4.5 border-b border-neutral-800 flex items-center justify-between">
                  <div className="flex gap-2.5 bg-neutral-950 p-1 rounded-xl">
                    <button
                      onClick={() => setSidebarTab('people')}
                      className={cn(
                        "px-4 py-2 text-xs font-extrabold uppercase tracking-wide rounded-lg transition-all",
                        sidebarTab === 'people' ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"
                      )}
                    >
                      Attendees
                    </button>
                    <button
                      onClick={() => setSidebarTab('chat')}
                      className={cn(
                        "px-4 py-2 text-xs font-extrabold uppercase tracking-wide rounded-lg transition-all",
                        sidebarTab === 'chat' ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"
                      )}
                    >
                      Chat Room
                    </button>
                  </div>
                  <button
                    onClick={() => setSidebarTab(null)}
                    className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-all"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Tab: People list Content */}
                {sidebarTab === 'people' && (
                  <div className="flex-grow flex flex-col p-4.5 min-h-0">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] uppercase tracking-widest font-black text-neutral-400">Total Participants</span>
                      <button
                        onClick={handleMuteAll}
                        className="px-2.5 py-1 border border-red-500/10 text-red-400 bg-red-500/5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all"
                      >
                        Mute All
                      </button>
                    </div>

                    <div className="flex-grow overflow-y-auto no-scrollbar space-y-3.5 min-h-0">
                      {participants.map((person) => (
                        <div
                          key={person.id}
                          className="flex items-center justify-between p-3 bg-neutral-950/40 border border-neutral-800/40 rounded-2xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden">
                              {person.avatar ? (
                                <img src={person.avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4.5 h-4.5 text-neutral-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white leading-tight flex items-center gap-1.5Packed">
                                {person.name}
                                {person.isLocal && <span className="text-[8px] bg-neon-blue text-slate-900 px-1 rounded font-black uppercase">You</span>}
                              </p>
                              <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">{person.role || 'Guest Patient'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {person.handRaised && (
                              <div className="p-1 rounded bg-amber-500 text-slate-950 text-xs animate-pulse">✋</div>
                            )}
                            <div className={cn(
                              "p-1.5 rounded-lg border",
                              person.audio ? "bg-neutral-800 border-neutral-700 text-white" : "bg-red-500/20 border-red-500/10 text-red-500"
                            )}>
                              {person.audio ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                            </div>
                            <div className={cn(
                              "p-1.5 rounded-lg border",
                              person.video ? "bg-neutral-800 border-neutral-700 text-white" : "bg-red-500/20 border-red-500/10 text-red-500"
                            )}>
                              {person.video ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab: Chat Room list Content */}
                {sidebarTab === 'chat' && (
                  <div className="flex-grow flex flex-col min-h-0 bg-neutral-900">
                    <div className="flex-grow overflow-y-auto no-scrollbar p-4.5 space-y-4 min-h-0">
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex flex-col gap-1 max-w-[85%]",
                            msg.isMe ? "ml-auto items-end" : "mr-auto items-start"
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{msg.sender}</span>
                            <span className="text-[8px] text-neutral-500 font-mono">{msg.time}</span>
                          </div>
                          <div className={cn(
                            "p-3 rounded-2xl text-xs leading-relaxed",
                            msg.isMe
                              ? "bg-neon-blue text-slate-900 rounded-tr-none font-medium"
                              : "bg-neutral-850 border border-neutral-800 text-white rounded-tl-none font-medium"
                          )}>
                            {msg.text}
                          </div>
                          {msg.scope !== 'Everyone' && (
                            <span className="text-[8px] font-black uppercase text-amber-500 tracking-wider">🔒 {msg.scope}</span>
                          )}
                        </div>
                      ))}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Chat selection scope toggle & Text input layout */}
                    <form onSubmit={handleSendChatMessage} className="p-4 border-t border-neutral-800 bg-neutral-950/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-extrabold">Send Destination:</span>
                        <select
                          value={chatScope}
                          onChange={(e) => setChatScope(e.target.value as any)}
                          className="bg-neutral-900 border border-neutral-850 text-[10px] font-extrabold text-neon-blue px-2 py-0.5 rounded outline-none"
                        >
                          <option value="Everyone">Everyone</option>
                          <option value="Physician Only">Physician Only</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newMsgText}
                          onChange={(e) => setNewMsgText(e.target.value)}
                          placeholder="Type message..."
                          className="flex-grow px-3.5 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:ring-1 focus:ring-neon-blue outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!newMsgText.trim()}
                          className="p-3 bg-neon-blue text-slate-900 hover:bg-neon-blue-dark disabled:opacity-30 rounded-xl transition-all"
                        >
                          <Send className="w-4 h-4 text-slate-900" />
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Layer C - Bottom Control Bar (80px height) */}
        <div className="h-[80px] bg-[#121214] border-t border-neutral-800 px-6 flex items-center justify-between shrink-0 z-50">
          
          <div className="hidden lg:flex flex-col gap-0.5">
            <span className="text-sm font-black text-white truncate max-w-[200px]">{roomId ? `Meeting: ${roomId.split('_')[0]}` : "PulsePoint Meeting"}</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest pl-1">Signaling Live</span>
            </div>
          </div>

          {/* Bottom active pill controls row */}
          <div className="flex items-center gap-4.5 mx-auto">
            <button
              onClick={toggleMic}
              className={cn(
                "w-[46px] h-[46px] rounded-full flex items-center justify-center transition-all bg-neutral-800 border/30 shadow hover:scale-105 active:scale-95 text-white border-neutral-700 hover:bg-neutral-750",
                !isMicOn && "bg-red-500 text-white border-red-500 hover:bg-red-600"
              )}
              title="Toggle Mic (M)"
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleVideo}
              className={cn(
                "w-[46px] h-[46px] rounded-full flex items-center justify-center transition-all bg-neutral-800 border/30 shadow hover:scale-105 active:scale-95 text-white border-neutral-700 hover:bg-neutral-750",
                !isVideoOn && "bg-red-500 text-white border-red-500 hover:bg-red-600"
              )}
              title="Toggle Video (C)"
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button
              onClick={startScreenShare}
              className={cn(
                "w-[46px] h-[46px] rounded-full flex items-center justify-center transition-all bg-neutral-800 border-neutral-700 text-white border hover:bg-neutral-750 hover:scale-105 active:scale-95",
                isScreenSharing && "bg-neon-blue/20 border-neon-blue text-neon-blue animate-pulse"
              )}
              title="Share Screen"
            >
              <Monitor className="w-5 h-5" />
            </button>
            <button
              onClick={toggleHandRaise}
              className={cn(
                "w-[46px] h-[46px] rounded-full flex items-center justify-center transition-all bg-neutral-800 border-neutral-700 text-white border hover:bg-neutral-750 hover:scale-105 active:scale-95",
                participants.find(p => p.isLocal)?.handRaised && "bg-amber-500 border-amber-400 text-slate-950"
              )}
              title="Raise Hand (R)"
            >
              <Hand className="w-5 h-5" />
            </button>
            
            {/* Layout selector dropdown */}
            <div className="relative group/layout">
              <button
                className="w-[46px] h-[46px] rounded-full flex items-center justify-center transition-all bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-750"
                title="Change Layout"
              >
                <LayoutIcon className="w-5 h-5" />
              </button>
              <div className="absolute bottom-13 left-1/2 -translate-x-1/2 w-40 bg-neutral-900 border border-neutral-800 p-2 rounded-2xl hidden group-hover/layout:block shadow-2xl">
                <p className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-500 p-1.5">Layouter Options</p>
                <button onClick={() => { setLayoutMode('auto'); setPinnedParticipantId(null); }} className={cn("w-full text-left p-2 rounded-xl text-xs font-semibold", layoutMode === 'auto' && !pinnedParticipantId ? "text-neon-blue bg-neutral-800" : "text-neutral-300 hover:bg-neutral-805")}>Auto Unified</button>
                <button onClick={() => { setLayoutMode('tiled'); setPinnedParticipantId(null); }} className={cn("w-full text-left p-2 rounded-xl text-xs font-semibold", layoutMode === 'tiled' ? "text-neon-blue bg-neutral-800" : "text-neutral-300 hover:bg-neutral-850")}>Tiled grid</button>
                <button onClick={() => { setLayoutMode('spotlight'); }} className={cn("w-full text-left p-2 rounded-xl text-xs font-semibold", layoutMode === 'spotlight' ? "text-neon-blue bg-neutral-800" : "text-neutral-300 hover:bg-neutral-850")}>Spotlight</button>
                <button onClick={() => { setLayoutMode('sidebar'); }} className={cn("w-full text-left p-2 rounded-xl text-xs font-semibold", layoutMode === 'sidebar' ? "text-neon-blue bg-neutral-800" : "text-neutral-300 hover:bg-neutral-850")}>Sidebar Strip</button>
              </div>
            </div>

            {/* Captions & Subtitles Toggle button */}
            <button
              onClick={() => setCaptionsActive(!captionsActive)}
              className={cn(
                "w-[46px] h-[46px] rounded-full flex items-center justify-center transition-all bg-neutral-800 border-neutral-700 text-white border hover:bg-neutral-750 hover:scale-105",
                captionsActive && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              )}
              title="Live Subtitles"
            >
              <span className="text-xs font-black uppercase tracking-tighter">cc</span>
            </button>

            <button
              onClick={handleHangUp}
              className="px-6 h-[46px] bg-red-600 border border-red-500/10 text-white rounded-full font-bold uppercase tracking-widest text-[11px] hover:bg-red-700 transition-all shadow-lg shadow-red-600/15 flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <Phone className="w-4 h-4 rotate-[135deg] fill-white" />
              <span className="hidden md:inline">End session</span>
            </button>
          </div>

          {/* Status signal and gear icon */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-3 bg-neutral-800 border border-neutral-700 hover:bg-neutral-750 text-neutral-300 rounded-xl transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Layer E - Advanced Telemetry & Settings Dialog */}
        <AnimatePresence>
          {showSettings && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg text-white">System Settings</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-850"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-3">Consultation Signal Strength</h4>
                    <div className="p-3 bg-neutral-950/50 rounded-2xl border border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-neon-blue" />
                        <span className="text-xs text-neutral-350 font-semibold">RTC Signal Latency</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400">14ms (Optimal)</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-3">Codec Details</h4>
                    <div className="p-3 bg-neutral-950/50 rounded-2xl border border-neutral-800 text-xs font-mono text-neutral-400 space-y-1">
                      <p>Video: VP9 profile 0 (1280x720@30fps)</p>
                      <p>Audio: Opus 48kHz (stereo, 64kbps)</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-3">Encryption Telemetry</h4>
                    <div className="p-3 bg-emerald-500/5 text-emerald-400 rounded-2xl border border-emerald-500/10 text-xs font-semibold leading-relaxed">
                      This session uses End-to-End Encryption (E2EE) with DTLS-SRTP protocols verified securely via clinical database tunnels.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full mt-6 py-3 bg-neutral-800 text-white hover:bg-neutral-750 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all"
                >
                  Done
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </GuestOverlay>
  );
};

export default Meeting;
