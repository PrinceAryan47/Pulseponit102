import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export interface CallSession {
  roomId: string;
  callerId: string;
  callerName: string;
  callerPhoto?: string;
  receiverId: string;
  receiverName: string;
  receiverPhoto?: string;
  type: 'audio' | 'video';
  status: 'ringing' | 'accepted' | 'rejected' | 'timeout' | 'cancelled' | 'ended';
}

interface SocketContextType {
  socket: Socket | null;
  incomingCall: CallSession | null;
  outgoingCall: CallSession | null;
  onlineUsersCount: number;
  onlineUsers: Set<string>;
  initiateCall: (
    receiverId: string,
    receiverName: string,
    receiverPhoto: string,
    type: 'audio' | 'video',
    roomId: string
  ) => void;
  acceptCall: () => void;
  declineCall: () => void;
  cancelCall: () => void;
  endCall: () => void;
  iceServers: any[] | null;
  clearSessions: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  incomingCall: null,
  outgoingCall: null,
  onlineUsersCount: 0,
  onlineUsers: new Set(),
  initiateCall: () => {},
  acceptCall: () => {},
  declineCall: () => {},
  cancelCall: () => {},
  endCall: () => {},
  iceServers: null,
  clearSessions: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<CallSession | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [iceServers, setIceServers] = useState<any[] | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Connect to Socket.io when profile is available
  useEffect(() => {
    if (!profile) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    const host = window.location.origin;
    console.log("[SocketContext] Connecting to socket server at:", host);
    const s = io(host, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => {
      console.log("[SocketContext] Connected to signaling socket:", s.id);
      s.emit("register-user", {
        userId: profile.uid,
        fullName: profile.fullName,
        photoURL: profile.photoURL || "",
      });
    });

    s.on("incoming-call", (data) => {
      console.log("[SocketContext] Incoming call received:", data);
      setIncomingCall({
        roomId: data.roomId,
        callerId: data.callerId,
        callerName: data.callerName,
        callerPhoto: data.callerPhoto,
        receiverId: profile.uid,
        receiverName: profile.fullName,
        receiverPhoto: profile.photoURL,
        type: data.type,
        status: "ringing",
      });
    });

    s.on("call-accepted", (data) => {
      console.log("[SocketContext] Call accepted by peer:", data);
      setIceServers(data.iceServers);

      setIncomingCall((prev) => (prev ? { ...prev, status: "accepted" } : null));
      setOutgoingCall((prev) => {
        if (prev) {
          return { ...prev, status: "accepted" };
        }
        return null;
      });
    });

    s.on("call-rejected", (data) => {
      console.log("[SocketContext] Call rejected by peer:", data);
      setOutgoingCall((prev) => (prev ? { ...prev, status: "rejected" } : null));
      setTimeout(() => {
        setOutgoingCall(null);
      }, 2500);
    });

    s.on("call-cancelled", (data) => {
      console.log("[SocketContext] Call cancelled by caller:", data);
      setIncomingCall(null);
    });

    s.on("call-timeout", (data) => {
      console.log("[SocketContext] Call timeout reached:", data);
      setIncomingCall(null);
      setOutgoingCall((prev) => (prev ? { ...prev, status: "timeout" } : null));
      setTimeout(() => {
        setOutgoingCall(null);
      }, 2500);
    });

    s.on("call-ended", (data) => {
      console.log("[SocketContext] Call ended by peer:", data);
      setIncomingCall(null);
      setOutgoingCall(null);
      // Let individual Meeting pages exit or notify
      window.dispatchEvent(new CustomEvent("peer-ended-call", { detail: data }));
    });

    s.on("user-presence-change", ({ userId, isOnline }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (isOnline) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    s.on("multi-login-logout", () => {
      console.log("[SocketContext] Logged out due to login from another device.");
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [profile]);

  const initiateCall = (
    receiverId: string,
    receiverName: string,
    receiverPhoto: string,
    type: 'audio' | 'video',
    roomId: string
  ) => {
    if (!socketRef.current || !profile) return;
    console.log(`[SocketContext] Initiating call to ${receiverName}`);

    const newSession: CallSession = {
      roomId,
      callerId: profile.uid,
      callerName: profile.fullName,
      callerPhoto: profile.photoURL || "",
      receiverId,
      receiverName,
      receiverPhoto,
      type,
      status: "ringing",
    };

    setOutgoingCall(newSession);

    socketRef.current.emit("initiate-call", {
      callerId: profile.uid,
      callerName: profile.fullName,
      callerPhoto: profile.photoURL || "",
      receiverId,
      type,
      roomId,
    });
  };

  const acceptCall = () => {
    if (!socketRef.current || !incomingCall) return;
    console.log("[SocketContext] Accepting call:", incomingCall.roomId);
    socketRef.current.emit("accept-call", { roomId: incomingCall.roomId });
    setIncomingCall((prev) => (prev ? { ...prev, status: "accepted" } : null));
  };

  const declineCall = () => {
    if (!socketRef.current || !incomingCall) return;
    console.log("[SocketContext] Declining call:", incomingCall.roomId);
    socketRef.current.emit("decline-call", { roomId: incomingCall.roomId });
    setIncomingCall(null);
  };

  const cancelCall = () => {
    if (!socketRef.current || !outgoingCall) return;
    console.log("[SocketContext] Canceling outgoing call:", outgoingCall.roomId);
    socketRef.current.emit("cancel-call", { roomId: outgoingCall.roomId });
    setOutgoingCall(null);
  };

  const endCall = () => {
    const activeRoomId = incomingCall?.roomId || outgoingCall?.roomId;
    if (!socketRef.current || !activeRoomId) return;
    console.log("[SocketContext] Ending active call:", activeRoomId);
    socketRef.current.emit("end-call", { roomId: activeRoomId });
    setIncomingCall(null);
    setOutgoingCall(null);
  };

  const clearSessions = () => {
    setIncomingCall(null);
    setOutgoingCall(null);
    setIceServers(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        incomingCall,
        outgoingCall,
        onlineUsersCount: onlineUsers.size,
        onlineUsers,
        initiateCall,
        acceptCall,
        declineCall,
        cancelCall,
        endCall,
        iceServers,
        clearSessions,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
