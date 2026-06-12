import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { GoogleGenAI } from "@google/genai";

// Helper to calculate distance on server
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
};

// Lazy initialize Gemini API instance
let aiClient: any = null;
function getAIClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined");
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return aiClient;
}

// In-Memory Redis Emulator with exact key-value storage & TTL support
class InMemoryRedis {
  private store = new Map<string, { value: any; expiry: number | null }>();

  constructor() {
    // Periodically sweep expired keys
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.store.entries()) {
        if (item.expiry && now > item.expiry) {
          this.store.delete(key);
        }
      }
    }, 1000);
  }

  async set(key: string, value: any, secondsTTL?: number) {
    const expiry = secondsTTL ? Date.now() + secondsTTL * 1000 : null;
    this.store.set(key, { value, expiry });
  }

  async get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async del(key: string) {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }
}

const redis = new InMemoryRedis();

// Track user connections
// Maps userId -> socketId
const onlineUsers = new Map<string, string>();
// Maps socketId -> { userId, fullName, photoURL }
const socketUserData = new Map<string, { userId: string; fullName: string; photoURL?: string }>();

// Group call room management: maps roomId -> Set of socketIds
const groupRooms = new Map<string, Set<string>>();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Socket.io logic
  io.on("connection", (socket: Socket) => {
    console.log("WebSocket connection established:", socket.id);

    // Register user presence
    socket.on("register-user", ({ userId, fullName, photoURL }) => {
      // Clean up previous registration for same user if exists
      const oldSocketId = onlineUsers.get(userId);
      if (oldSocketId && oldSocketId !== socket.id) {
        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
          oldSocket.emit("multi-login-logout");
          oldSocket.disconnect();
        }
      }

      onlineUsers.set(userId, socket.id);
      socketUserData.set(socket.id, { userId, fullName, photoURL });
      console.log(`User registered: ${fullName} (${userId}) on socket ${socket.id}`);

      // Broadcast presence update
      io.emit("user-presence-change", { userId, isOnline: true });
    });

    // Check availability of user
    socket.on("check-availability", async ({ targetUserId }, callback) => {
      if (!onlineUsers.has(targetUserId)) {
        return callback({ available: false, reason: "offline" });
      }
      const isBusy = await redis.exists(`call:${targetUserId}`);
      if (isBusy) {
        return callback({ available: false, reason: "busy" });
      }
      callback({ available: true });
    });

    // Initiate WebRTC call (similar to WhatsApp)
    socket.on("initiate-call", async (data) => {
      // data: { callerId, callerName, callerPhoto, receiverId, type, roomId }
      const { callerId, callerName, callerPhoto, receiverId, type, roomId } = data;
      console.log(`Call initiated from ${callerName} to ${receiverId} (Type: ${type}, Room: ${roomId})`);

      const targetSocketId = onlineUsers.get(receiverId);

      // 1. Check if receiver is online
      if (!targetSocketId) {
        socket.emit("call-error", { message: "User is offline", roomId });
        return;
      }

      // 2. Check if receiver is busy
      const isBusy = await redis.exists(`call:${receiverId}`);
      if (isBusy) {
        socket.emit("call-busy", { receiverId, roomId });
        return;
      }

      // 3. Setup Call State with 30-second TTL in "Redis"
      const callState = {
        roomId,
        callerId,
        callerName,
        callerPhoto,
        receiverId,
        type,
        status: "ringing",
        createdAt: Date.now()
      };

      await redis.set(`call:${callerId}`, callState, 30);
      await redis.set(`call:${receiverId}`, callState, 30);
      await redis.set(`room:${roomId}`, callState, 30);

      // 4. Set unanswered call timeout mechanism (30-second TTL)
      const timeoutId = setTimeout(async () => {
        const currentCall = await redis.get(`room:${roomId}`);
        if (currentCall && currentCall.status === "ringing") {
          console.log(`Call ${roomId} missed - unanswered timeout reached`);
          await redis.del(`call:${callerId}`);
          await redis.del(`call:${receiverId}`);
          await redis.del(`room:${roomId}`);

          io.to(socket.id).emit("call-timeout", { roomId });
          io.to(targetSocketId).emit("call-timeout", { roomId });
        }
      }, 30000);

      // Maintain timeout mapping in socket if needed or leave it to TTL check
      socket.data.timeoutId = timeoutId;

      // 5. Send incoming call notification to receiver
      io.to(targetSocketId).emit("incoming-call", {
        callerId,
        callerName,
        callerPhoto: callerPhoto || "",
        roomId,
        type
      });
    });

    // Accept Incoming Call
    socket.on("accept-call", async ({ roomId }) => {
      console.log(`Call accepted: ${roomId}`);
      const callState = await redis.get(`room:${roomId}`);
      if (!callState) {
        socket.emit("call-error", { message: "Call expired or was cancelled", roomId });
        return;
      }

      // Update call states to 'active' on Redis (longer lease of 1 hour)
      const updatedCall = { ...callState, status: "active", acceptedAt: Date.now() };
      await redis.set(`call:${callState.callerId}`, updatedCall, 3600);
      await redis.set(`call:${callState.receiverId}`, updatedCall, 3600);
      await redis.set(`room:${roomId}`, updatedCall, 3600);

      // STUN and fallbacks for NAT traversal, plus TURN Server credentials when P2P direct fails
      const icerConfig = {
        roomId,
        iceServers: [
          { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
          { 
            urls: ["turn:turn.example.com:3478?transport=udp", "turn:turn.example.com:3478?transport=tcp"], 
            username: "pulsepoint_healthcare_webrtc", 
            credential: "secure_consulation_turn_fallback_token_2026" 
          }
        ]
      };

      // Notify caller and callee
      const callerSocketId = onlineUsers.get(callState.callerId);
      const receiverSocketId = onlineUsers.get(callState.receiverId);

      if (callerSocketId) {
        io.to(callerSocketId).emit("call-accepted", icerConfig);
      }
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("call-accepted", icerConfig);
      }
    });

    // Decline/Reject Call
    socket.on("decline-call", async ({ roomId }) => {
      console.log(`Call declined: ${roomId}`);
      const callState = await redis.get(`room:${roomId}`);
      if (callState) {
        await redis.del(`call:${callState.callerId}`);
        await redis.del(`call:${callState.receiverId}`);
        await redis.del(`room:${roomId}`);

        const callerSocketId = onlineUsers.get(callState.callerId);
        if (callerSocketId) {
          io.to(callerSocketId).emit("call-rejected", { roomId });
        }
      }
    });

    // Cancel Call (from caller side)
    socket.on("cancel-call", async ({ roomId }) => {
      console.log(`Caller cancelled call: ${roomId}`);
      const callState = await redis.get(`room:${roomId}`);
      if (callState) {
        await redis.del(`call:${callState.callerId}`);
        await redis.del(`call:${callState.receiverId}`);
        await redis.del(`room:${roomId}`);

        const receiverSocketId = onlineUsers.get(callState.receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("call-cancelled", { roomId });
        }
      }
    });

    // End Active Call
    socket.on("end-call", async ({ roomId }) => {
      console.log(`Call terminated: ${roomId}`);
      const callState = await redis.get(`room:${roomId}`);
      if (callState) {
        await redis.del(`call:${callState.callerId}`);
        await redis.del(`call:${callState.receiverId}`);
        await redis.del(`room:${roomId}`);

        const otherUserId = socketUserData.get(socket.id)?.userId === callState.callerId 
          ? callState.receiverId 
          : callState.callerId;

        const otherSocketId = onlineUsers.get(otherUserId);
        if (otherSocketId) {
          io.to(otherSocketId).emit("call-ended", { roomId });
        }
      }
    });

    // WebRTC Real-Time Signaling Relay
    socket.on("webrtc-offer", ({ roomId, offer, to }) => {
      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        console.log(`Relaying WebRTC offer from ${socket.id} to ${targetSocketId} for room ${roomId}`);
        io.to(targetSocketId).emit("webrtc-offer", { roomId, offer, from: socketUserData.get(socket.id)?.userId });
      }
    });

    socket.on("webrtc-answer", ({ roomId, answer, to }) => {
      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        console.log(`Relaying WebRTC answer from ${socket.id} to ${targetSocketId} for room ${roomId}`);
        io.to(targetSocketId).emit("webrtc-answer", { roomId, answer, from: socketUserData.get(socket.id)?.userId });
      }
    });

    socket.on("webrtc-ice-candidate", ({ roomId, candidate, to }) => {
      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc-ice-candidate", { roomId, candidate, from: socketUserData.get(socket.id)?.userId });
      }
    });

    // --- GROUP CALLS / SFU SIMULATION ---
    // Handles group signaling rooms where media streams are mixed or selectively forwarded
    socket.on("join-group-call", ({ roomId, userId, fullName }) => {
      socket.join(roomId);
      console.log(`User ${fullName} (${userId}) joined group call room ${roomId}`);

      if (!groupRooms.has(roomId)) {
        groupRooms.set(roomId, new Set());
      }
      groupRooms.get(roomId)!.add(socket.id);

      // Notify others in group call room
      socket.to(roomId).emit("group-user-joined", { socketId: socket.id, userId, fullName });

      // Send the current list of other participants back to the joining user
      const peers = Array.from(groupRooms.get(roomId)!)
        .filter(sid => sid !== socket.id)
        .map(sid => ({
          socketId: sid,
          userId: socketUserData.get(sid)?.userId,
          fullName: socketUserData.get(sid)?.fullName
        }));
      socket.emit("group-current-peers", { peers });
    });

    // SFU Selective Forwarding / Mesh WebRTC Signaling for Group Members
    socket.on("group-webrtc-offer", ({ roomId, offer, toSocketId }) => {
      console.log(`SFU routing group offer from ${socket.id} to ${toSocketId}`);
      io.to(toSocketId).emit("group-webrtc-offer", {
        fromSocketId: socket.id,
        offer,
        fromUserId: socketUserData.get(socket.id)?.userId
      });
    });

    socket.on("group-webrtc-answer", ({ roomId, answer, toSocketId }) => {
      console.log(`SFU routing group answer from ${socket.id} to ${toSocketId}`);
      io.to(toSocketId).emit("group-webrtc-answer", {
        fromSocketId: socket.id,
        answer
      });
    });

    socket.on("group-ice-candidate", ({ roomId, candidate, toSocketId }) => {
      io.to(toSocketId).emit("group-ice-candidate", {
        fromSocketId: socket.id,
        candidate
      });
    });

    socket.on("leave-group-call", ({ roomId }) => {
      socket.leave(roomId);
      console.log(`User ${socket.id} left group room ${roomId}`);
      if (groupRooms.has(roomId)) {
        groupRooms.get(roomId)!.delete(socket.id);
        if (groupRooms.get(roomId)!.size === 0) {
          groupRooms.delete(roomId);
        }
      }
      socket.to(roomId).emit("group-user-left", { socketId: socket.id });
    });

    // Chat room joining
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit("user-joined", socket.id);
      console.log(`User ${socket.id} joined chat room ${roomId}`);
    });

    socket.on("send-message", (data) => {
      io.to(data.roomId).emit("receive-message", data);
    });

    socket.on("typing", (data) => {
      socket.to(data.roomId).emit("user-typing", data);
    });

    // Disconnect cleanup
    socket.on("disconnect", async () => {
      const uData = socketUserData.get(socket.id);
      console.log("WebSocket user disconnected:", socket.id);

      if (uData) {
        const { userId, fullName } = uData;
        console.log(`Clearing presence registration for ${fullName}`);
        onlineUsers.delete(userId);
        socketUserData.delete(socket.id);

        // Cancel/Clean up calls associated with this user
        const callingState = await redis.get(`call:${userId}`);
        if (callingState) {
          const roomId = callingState.roomId;
          console.log(`Cleaning up disconnected user's active/pending call: ${roomId}`);
          await redis.del(`call:${callingState.callerId}`);
          await redis.del(`call:${callingState.receiverId}`);
          await redis.del(`room:${roomId}`);

          // Emit call-ended/cancelled to the peer
          const peerId = callingState.callerId === userId ? callingState.receiverId : callingState.callerId;
          const peerSocketId = onlineUsers.get(peerId);
          if (peerSocketId) {
            io.to(peerSocketId).emit("call-ended", { roomId });
          }
        }

        // Broadcast presence update
        io.emit("user-presence-change", { userId, isOnline: false });
      }

      // Cleanup group rooms
      for (const [roomId, socketIds] of groupRooms.entries()) {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id);
          socket.to(roomId).emit("group-user-left", { socketId: socket.id });
          if (socketIds.size === 0) {
            groupRooms.delete(roomId);
          }
        }
      }
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Secure server-side Gemini generation proxy
  app.post("/api/ai/generate", async (req, res) => {
    const { model, contents, config } = req.body;
    if (!contents) {
      return res.status(400).json({ error: "contents is a required field" });
    }

    try {
      const ai = getAIClient();
      
      // Map newer or preview model names to stable ones if needed, or stick to requested model
      let targetModel = model || "gemini-1.5-flash";
      if (targetModel.includes("gemini-3-flash") || targetModel.includes("gemini-3")) {
        targetModel = "gemini-2.5-flash"; // stable, blazing fast, fully featured standard model
      }

      console.log(`Backend proxy: Generating content using model ${targetModel}`);
      const response = await ai.models.generateContent({
        model: targetModel,
        contents,
        config,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Generation error on server proxy:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI content" });
    }
  });

  // Proxy to fetch real facilities near the coordinates using Gemini grounding
  app.post("/api/facilities", async (req, res) => {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "lat and lng are required fields" });
    }

    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Find real medical facilities (hospitals, clinics, pharmacies) near coordinates ${lat}, ${lng}. 
        Return a list of real facilities with their exact names, full addresses, and types. 
        Prioritize hospitals and clinics with 24/7 service if available.`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: parseFloat(lat),
                longitude: parseFloat(lng)
              }
            }
          }
        },
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (!groundingChunks) {
        return res.json([]);
      }

      const facilities = groundingChunks
        .filter((chunk: any) => chunk.maps)
        .map((chunk: any) => {
          const title = chunk.maps.title || "Unknown Facility";
          const lowerTitle = title.toLowerCase();
          
          let type: 'hospital' | 'clinic' | 'pharmacy' = 'hospital';
          if (lowerTitle.includes('pharmacy') || lowerTitle.includes('chemist') || lowerTitle.includes('drugstore')) {
            type = 'pharmacy';
          } else if (lowerTitle.includes('clinic') || lowerTitle.includes('medical center') || lowerTitle.includes('health center')) {
            type = 'clinic';
          }

          const fLat = chunk.maps.location?.lat;
          const fLng = chunk.maps.location?.lng;
          let distanceMeter = 0;
          let distanceDisplay = '';

          if (fLat && fLng) {
            distanceMeter = calculateDistance(parseFloat(lat), parseFloat(lng), fLat, fLng);
            distanceDisplay = distanceMeter > 1000 
              ? `${(distanceMeter / 1000).toFixed(1)} km` 
              : `${Math.round(distanceMeter)} m`;
          }

          return {
            name: title,
            address: chunk.maps.address || "Address not available",
            type,
            mapsUrl: chunk.maps.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title + ' ' + (chunk.maps.address || ''))}`,
            lat: fLat,
            lng: fLng,
            distanceMeter,
            distanceDisplay,
            reviews: chunk.maps.placeAnswerSources?.reviewSnippets?.map((s: any) => s.text) || []
          };
        })
        .sort((a: any, b: any) => (a.distanceMeter || 0) - (b.distanceMeter || 0));

      res.json(facilities);
    } catch (error) {
      console.error("Error in backend finding nearby facilities:", error);
      res.status(500).json({ error: "Failed to fetch nearby medical facilities via Grounding" });
    }
  });

  // Admin API (Mocked for now as we don't have service account, but centralized here)
  app.post("/api/admin/verify", (req, res) => {
    const { email } = req.body;
    const admins = ["mafialord1247@gmail.com", "mafia.lord1247@gmail.com", "prince47aryan@gmail.com"];
    if (admins.includes(email)) {
      res.json({ authorized: true });
    } else {
      res.status(403).json({ authorized: false });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
