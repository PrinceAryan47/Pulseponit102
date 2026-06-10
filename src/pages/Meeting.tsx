import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { UserProfile } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Maximize, 
  User,
  Settings,
  AlertCircle,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import GuestOverlay from '../components/GuestOverlay';
import { cn } from '../lib/utils';

const Meeting: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { profile } = useAuth();
  const { socket, endCall, iceServers, clearSessions } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const callType = queryParams.get('type') || 'video';
  const isCaller = queryParams.get('caller') === 'true';

  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'initializing' | 'connecting' | 'connected' | 'disconnected' | 'failed'>('initializing');
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Default fallback ICE Servers if not delivered by Socket server
  const defaultIceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  const configuration = {
    iceServers: iceServers || defaultIceServers,
    iceCandidatePoolSize: 10,
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (connectionStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [connectionStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addLog = (msg: string) => {
    console.log(`[Meeting-WS] ${msg}`);
    setConnectionLogs(prev => [...prev.slice(-4), msg]);
  };

  // Listen for custom "peer-ended-call" event from SocketContext
  useEffect(() => {
    const handlePeerEnded = () => {
      addLog("Peer terminated call.");
      setConnectionStatus('disconnected');
      setTimeout(() => {
        clearSessions();
        navigate(-1);
      }, 1500);
    };

    window.addEventListener("peer-ended-call", handlePeerEnded);
    return () => {
      window.removeEventListener("peer-ended-call", handlePeerEnded);
    };
  }, [navigate]);

  useEffect(() => {
    if (!roomId || !profile || !socket) return;

    let otherUserId = "";
    const fetchOtherUser = async () => {
      addLog("Fetching participant details...");
      const users = roomId.split('_');
      otherUserId = users.find(id => id !== profile.uid) || "";
      if (otherUserId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            setOtherUser(userDoc.data() as UserProfile);
          }
        } catch (e) {
          console.error("Error loading user profile:", e);
        }
      }
    };
    fetchOtherUser();

    // Setup WebRTC Signalling over WS
    const startCall = async () => {
      try {
        addLog("Requesting local media access...");
        setConnectionStatus('connecting');
        
        // 1. Fetch Local Stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: callType === 'video',
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        addLog("Local media streams enabled.");

        // 2. Setup RTCPeerConnection
        const pc = new RTCPeerConnection(configuration);
        peerConnectionRef.current = pc;

        // Add local tracks
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Handle remote stream addition
        const remoteMediaStream = new MediaStream();
        setRemoteStream(remoteMediaStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteMediaStream;
        }

        pc.ontrack = (event) => {
          addLog(`Remote audio/video stream received.`);
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
          addLog(`ICE Connection State: ${pc.iceConnectionState}`);
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            setConnectionStatus('connected');
          }
          if (pc.iceConnectionState === 'disconnected') setConnectionStatus('disconnected');
          if (pc.iceConnectionState === 'failed') {
            setConnectionStatus('failed');
            setError("Peer connection lost. Switching to fallback or retry.");
          }
        };

        pc.onconnectionstatechange = () => {
          addLog(`Peer State: ${pc.connectionState}`);
          if (pc.connectionState === 'connected') setConnectionStatus('connected');
          if (pc.connectionState === 'failed') {
            setConnectionStatus('failed');
            setError("WebRTC Negotiation failed. Please try again.");
          }
        };

        // 3. WS WebRTC Signaling Logic
        if (isCaller) {
          // CALLER creates offer
          addLog("Acting as caller. Creating offer desc...");
          const offerDescription = await pc.createOffer();
          await pc.setLocalDescription(offerDescription);

          socket.emit("webrtc-offer", {
            roomId,
            offer: {
              sdp: offerDescription.sdp,
              type: offerDescription.type
            },
            to: otherUserId
          });
          addLog("Offer sent. Awaiting WebRTC answer...");

          // Listen for answer
          socket.on("webrtc-answer", async (data) => {
            if (data.roomId === roomId && !pc.currentRemoteDescription) {
              addLog("WebRTC answer received. Setting remote desc...");
              const answerDescription = new RTCSessionDescription(data.answer);
              await pc.setRemoteDescription(answerDescription);
            }
          });

        } else {
          // CALLEE awaits offer and answers
          addLog("Acting as callee. Awaiting WebRTC offer...");
          
          socket.on("webrtc-offer", async (data) => {
            if (data.roomId === roomId && !pc.currentRemoteDescription) {
              addLog("WebRTC offer received. Setting remote description...");
              await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
              
              addLog("Creating and returning WebRTC answer...");
              const answerDescription = await pc.createAnswer();
              await pc.setLocalDescription(answerDescription);

              socket.emit("webrtc-answer", {
                roomId,
                answer: {
                  sdp: answerDescription.sdp,
                  type: answerDescription.type
                },
                to: otherUserId
              });
            }
          });
        }

        // Both sides listen for ICE candidates
        socket.on("webrtc-ice-candidate", async (data) => {
          if (data.roomId === roomId && data.candidate && pc) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (e) {
              console.error("Error adding remote ICE candidate", e);
            }
          }
        });

      } catch (err: any) {
        console.error("Error starting WebRTC session:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError("Video calling requires camera and microphone permissions.");
        } else {
          setError("Could not launch secure video consultation stream.");
        }
      }
    };

    startCall();

    return () => {
      // Cleanup WebRTC signaling listeners
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice-candidate");
    };
  }, [roomId, profile, callType, retryCount, socket, isCaller]);

  useEffect(() => {
    return () => {
      // Cleanup camera traces on page change / hangup
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [localStream]);

  const restartCall = () => {
    addLog("Restarting consultation connection...");
    setError(null);
    setConnectionStatus('initializing');
    setRetryCount(prev => prev + 1);
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => (track.enabled = !isMicOn));
      setIsMicOn(!isMicOn);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => (track.enabled = !isVideoOn));
      setIsVideoOn(!isVideoOn);
    }
  };

  const handleHangUp = () => {
    addLog("Leaving consultation session.");
    endCall();
    clearSessions();
    navigate(-1);
  };

  return (
    <GuestOverlay
      title="Virtual Consultation Hub"
      description="Access encrypted video consulting with licensed private physicians on demand."
    >
      <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col">
        {/* Video Frame */}
        <div className="flex-grow relative flex items-center justify-center p-4">
          {/* Main Display Frame (Remote Video) */}
          <div className="w-full h-full rounded-3xl overflow-hidden bg-slate-800 relative">
            {error ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Stream Disruption</h3>
                <p className="text-slate-400 max-w-md mb-8">{error}</p>
                <div className="flex gap-4">
                  <button 
                    onClick={restartCall}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-all"
                  >
                    Reconnect
                  </button>
                  <button 
                    onClick={handleHangUp}
                    className="px-8 py-3 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-all"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : remoteStream && connectionStatus === 'connected' ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                  {otherUser?.photoURL ? (
                    <img src={otherUser.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-slate-400" />
                  )}
                </div>
                <p className="text-lg font-medium text-slate-300">
                  {connectionStatus === 'connecting' ? 'Acquiring credentials and dialing secure lines...' : 
                   connectionStatus === 'disconnected' ? 'Participant has left the consultation.' :
                   otherUser ? `Waiting for ${otherUser.fullName} to join...` : 'Connecting sound & vision...'}
                </p>
                {connectionStatus === 'connecting' && (
                  <div className="mt-4 flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}
                <div className="mt-8 flex flex-col items-center gap-2">
                  {connectionLogs.map((log, i) => (
                    <p key={i} className="text-[10px] text-slate-600 font-mono uppercase tracking-tighter">
                      {log}
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            {/* Status indicators */}
            <div className="absolute top-6 left-6 flex flex-col gap-2">
              <div className="flex items-center gap-3 bg-black/45 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  connectionStatus === 'connected' ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                )}></div>
                <span className="text-white text-sm font-bold">
                  {otherUser ? `Consultation with ${otherUser.fullName}` : 'Virtual Medical Consultation'}
                </span>
              </div>
              {connectionStatus === 'connected' && (
                <div className="flex gap-2">
                  <div className="bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 w-fit">
                    <span className="text-white text-xs font-mono font-bold tracking-wider">
                      {formatDuration(callDuration)}
                    </span>
                  </div>
                  <div className="bg-emerald-500/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/20 w-fit flex items-center gap-2">
                    <div className="flex gap-0.5 items-end h-3">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                      <div className="w-1 h-2 bg-emerald-500 rounded-full"></div>
                      <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                    </div>
                    <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Picture in Picture (Local Video preview) */}
          <motion.div 
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            className="absolute bottom-24 right-8 w-48 h-64 bg-slate-700 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl cursor-move z-10"
          >
            {isVideoOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800">
                <User className="w-10 h-10 text-slate-600" />
              </div>
            )}
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-lg text-[10px] text-white font-bold uppercase">
              Your Stream
            </div>
          </motion.div>
        </div>

        {/* Media Controls bar */}
        <div className="h-24 bg-slate-900/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-6 px-8">
          <button 
            onClick={toggleMic}
            className={`p-4 rounded-2xl transition-all ${isMicOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}
          >
            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={toggleVideo}
            className={`p-4 rounded-2xl transition-all ${isVideoOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}
          >
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          <button 
            onClick={handleHangUp}
            className="p-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          <div className="w-px h-8 bg-white/10 mx-2"></div>

          <button 
            onClick={restartCall}
            title="Refresh stream"
            className="p-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all"
          >
            <Activity className="w-6 h-6" />
          </button>
          
          <button className="p-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all">
            <Maximize className="w-6 h-6" />
          </button>
          
          <button className="p-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>
    </GuestOverlay>
  );
};

export default Meeting;
