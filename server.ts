import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { GoogleGenAI } from "@google/genai";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase Admin lazily and safely
let adminDb: admin.firestore.Firestore | null = null;

function getAdminDb(): admin.firestore.Firestore | null {
  if (!adminDb) {
    try {
      if (firebaseConfig && firebaseConfig.projectId) {
        if (admin.apps.length === 0) {
          admin.initializeApp({
            projectId: firebaseConfig.projectId,
          });
        }
        const databaseId = firebaseConfig.firestoreDatabaseId;
        if (databaseId && databaseId !== "(default)") {
          adminDb = getFirestore(admin.apps[0], databaseId);
        } else {
          adminDb = getFirestore(admin.apps[0]);
        }
      }
    } catch (err) {
      console.error("Failed to initialize firebase-admin on backend:", err);
    }
  }
  return adminDb;
}

const DEFAULT_HOSPITALS = [
  {
    name: "Mulago National Referral Hospital",
    licenseNumber: "HOSP-UG-001",
    address: "Mulago Hill, Kampala, Uganda",
    contactPhone: "+256 414 554001",
    contactEmail: "info@mulago.or.ug",
    services: ["General Surgery", "Internal Medicine", "Pediatrics", "Obstetrics & Gynecology", "Emergency"],
    openingHours: "24/7",
    photoURL: "https://images.unsplash.com/photo-1587350859728-117699f4a1ec?auto=format&fit=crop&q=80&w=800",
    location: { lat: 0.3378, lng: 32.5761 }
  },
  {
    name: "Nakasero Hospital",
    licenseNumber: "HOSP-UG-002",
    address: "Plot 14A Akii Bua Rd, Kampala, Uganda",
    contactPhone: "+256 312 531300",
    contactEmail: "info@nhl.co.ug",
    services: ["Cardiology", "Neurology", "Oncology", "Emergency", "Diagnostics"],
    openingHours: "24/7",
    photoURL: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800",
    location: { lat: 0.3265, lng: 32.5815 }
  },
  {
    name: "International Hospital Kampala (IHK)",
    licenseNumber: "HOSP-UG-004",
    address: "Plot 4686 Barnabas Rd, Namuwongo, Kampala",
    contactPhone: "+256 312 200400",
    contactEmail: "info@img.co.ug",
    services: ["Emergency Medicine", "Intensive Care", "Surgery", "Maternity", "ICU"],
    openingHours: "24/7",
    photoURL: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800",
    location: { lat: 0.3015, lng: 32.6105 }
  },
  {
    name: "St. Francis Hospital Nsambya",
    licenseNumber: "HOSP-UG-005",
    address: "Nsambya Hill, Kampala, Uganda",
    contactPhone: "+256 414 267012",
    contactEmail: "info@nsambyahospital.or.ug",
    services: ["Obstetrics", "Gynecology", "Pediatrics", "Surgery", "Maternity"],
    openingHours: "24/7",
    photoURL: "https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=800",
    location: { lat: 0.3012, lng: 32.5878 }
  },
  {
    name: "Case Hospital",
    licenseNumber: "HOSP-UG-003",
    address: "Plot 69/71 Buganda Rd, Kampala, Uganda",
    contactPhone: "+256 312 250700",
    contactEmail: "info@casemedicalcentre.com",
    services: ["Dermatology", "Orthopedics", "Radiology", "General Practice", "Emergency", "Dental"],
    openingHours: "24/7",
    photoURL: "https://images.unsplash.com/photo-1538108197017-c13466739195?auto=format&fit=crop&q=80&w=800",
    location: { lat: 0.3242, lng: 32.5786 }
  },
  {
    name: "Uganda Martyrs Hospital Lubaga",
    licenseNumber: "HOSP-UG-006",
    address: "Lubaga Hill, Kampala, Uganda",
    contactPhone: "+256 414 270221",
    contactEmail: "info@lubagahospital.org",
    services: ["General Medicine", "Surgery", "Maternity", "Pediatrics"],
    openingHours: "24/7",
    photoURL: "https://images.unsplash.com/photo-1504439468489-c8920d796a29?auto=format&fit=crop&q=80&w=800",
    location: { lat: 0.3025, lng: 32.5535 }
  },
  {
    name: "Mengo Hospital",
    licenseNumber: "HOSP-UG-007",
    address: "Namirembe Hill, Kampala, Uganda",
    contactPhone: "+256 414 270222",
    contactEmail: "info@mengohospital.org",
    services: ["Dental", "Eye Care", "Surgery", "Maternity", "Pediatrics"],
    openingHours: "24/7",
    photoURL: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800",
    location: { lat: 0.3125, lng: 32.5595 }
  },
  {
    name: "Kibuli Muslim Hospital",
    licenseNumber: "HOSP-UG-008",
    address: "Kibuli Hill, Kampala, Uganda",
    contactPhone: "+256 414 235296",
    contactEmail: "info@kibulihospital.org",
    services: ["General Medicine", "Surgery", "Maternity", "Diagnostics"],
    openingHours: "24/7",
    photoURL: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800",
    location: { lat: 0.3085, lng: 32.5975 }
  },
  {
    name: "Mbarara Regional Referral Hospital",
    licenseNumber: "HOSP-UG-009",
    address: "Mbarara-Kabale Road, Mbarara, Uganda",
    contactPhone: "+256 485 420020",
    contactEmail: "info@mbararahospital.or.ug",
    services: ["Major teaching and referral hospital", "Spacious diagnostic and surgical wards"],
    openingHours: "24/7",
    photoURL: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800",
    location: { lat: -0.6151, lng: 30.6558 }
  },
  {
    name: "Gulu Regional Referral Hospital",
    licenseNumber: "HOSP-UG-010",
    address: "Hospital Road, Gulu, Uganda",
    contactPhone: "+256 471 432021",
    contactEmail: "info@guluhospital.or.ug",
    services: ["Primary public referral health center", "24/7 critical emergency and pediatric departments"],
    openingHours: "24/7",
    photoURL: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800",
    location: { lat: 2.7725, lng: 32.3006 }
  },
  {
    name: "Jinja Regional Referral Hospital",
    licenseNumber: "HOSP-UG-011",
    address: "Clifton Road, Jinja, Uganda",
    contactPhone: "+256 434 120022",
    contactEmail: "info@jinjahospital.or.ug",
    services: ["Large-scale public medical center", "Fully equipped maternity and surgical operations"],
    openingHours: "24/7",
    photoURL: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800",
    location: { lat: 0.4283, lng: 33.2045 }
  },
  {
    name: "St. Mary's Hospital Lacor",
    licenseNumber: "HOSP-UG-012",
    address: "Gulu-Nimule Road, Gulu, Uganda",
    contactPhone: "+256 471 435002",
    contactEmail: "info@lacorhospital.org",
    services: ["Mission-based private hospital", "Affordable care, prompt treatment, and complete laboratory diagnostics"],
    openingHours: "24/7",
    photoURL: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800",
    location: { lat: 2.7611, lng: 32.2589 }
  },
  {
    name: "Fort Portal Regional Referral Hospital",
    licenseNumber: "HOSP-UG-013",
    address: "Fort Portal-Kasese Road, Fort Portal, Uganda",
    contactPhone: "+256 483 422023",
    contactEmail: "info@fortportalhospital.or.ug",
    services: ["Strategic referral center", "Professional clinical staff and emergency triage"],
    openingHours: "24/7",
    photoURL: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800",
    location: { lat: 0.6525, lng: 30.2747 }
  },
  {
    name: "Mbale Regional Referral Hospital",
    licenseNumber: "HOSP-UG-014",
    address: "Pallisa Road, Mbale, Uganda",
    contactPhone: "+256 454 433024",
    contactEmail: "info@mbalehospital.or.ug",
    services: ["Leading tertiary hospital", "Highly active outpatient and neonatal clinics"],
    openingHours: "24/7",
    photoURL: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800",
    location: { lat: 1.0744, lng: 34.1758 }
  }
];

async function getHospitalsFromDb(): Promise<any[]> {
  const db = getAdminDb();
  if (!db) {
    console.log("Firebase Admin DB not initialized. Returning default hospitals fallback.");
    return DEFAULT_HOSPITALS;
  }
  try {
    const snap = await db.collection("hospitals").get();
    const list: any[] = [];
    snap.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });
    if (list.length === 0) {
      return DEFAULT_HOSPITALS;
    }
    return list;
  } catch (err: any) {
    console.log("Note: Server-side Firebase Admin read is unavailable. Gracefully serving default hospitals fallback.");
    return DEFAULT_HOSPITALS;
  }
}

async function seedHospitalsIfEmpty() {
  const db = getAdminDb();
  if (!db) return;
  try {
    const snap = await db.collection("hospitals").limit(1).get();
    if (snap.empty) {
      console.log("No hospitals found in Firestore database. Seeding Partner Hospitals automatically...");
      const batch = db.batch();
      for (const hosp of DEFAULT_HOSPITALS) {
        const ref = db.collection("hospitals").doc();
        batch.set(ref, hosp);
      }
      await batch.commit();
      console.log("Partner Hospitals seeded successfully inside Firestore database.");
    } else {
      console.log("Hospitals collection already has records in Firestore.");
    }
  } catch (err: any) {
    if (err?.message?.includes("PERMISSION_DENIED") || err?.code === 7) {
      console.log("Note: Server-side Firebase Admin lacks write permissions for auto-seeding. Default fallback hospitals list will be served gracefully on backend requests.");
    } else {
      console.log("Auto-seeding database check notice:", err?.message || err);
    }
  }
}

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
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
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

  // Helper for medical and wellness generation fallbacks in case of Gemini rate limiting/unavailability
  function getAIGenerationFallback(contents: any): string {
    try {
      let promptText = "";
      if (typeof contents === "string") {
        promptText = contents;
      } else if (Array.isArray(contents)) {
        const lastItem = contents[contents.length - 1];
        if (lastItem && lastItem.parts && Array.isArray(lastItem.parts)) {
          promptText = lastItem.parts.map((p: any) => p.text || "").join(" ");
        } else {
          promptText = JSON.stringify(contents);
        }
      } else {
        promptText = String(contents || "");
      }

      const normalized = promptText.toLowerCase();

      // 1. Daily Health Tips / Insights
      if (normalized.includes("daily health tip") || normalized.includes("single-sentence action-oriented") || normalized.includes("evidence-based daily health tip")) {
        const tips = [
          {
            tip: "Prioritizing 7.5 to 8 hours of quality sleep directly optimizes cellular self-repair and mental focus.",
            source: "Harvard T.H. Chan School of Public Health",
            sourceUrl: "https://www.hsph.harvard.edu"
          },
          {
            tip: "Brisk morning walking for just 15 minutes reduces cardiovascular risks and regulates metabolic markers significantly.",
            source: "Mayo Clinic",
            sourceUrl: "https://www.mayoclinic.org"
          },
          {
            tip: "Keep active hydration targets near half your body weight in fluid ounces to sustain peak daily cognitive endurance.",
            source: "World Health Organization",
            sourceUrl: "https://www.who.int"
          },
          {
            tip: "Injecting high-fiber plant proteins and minimizing overly refined sugars stabilizes metabolic blood sugar trends.",
            source: "Cleveland Clinic",
            sourceUrl: "https://my.clevelandclinic.org"
          }
        ];

        const chosen = tips[Math.floor(Math.random() * tips.length)];

        if (normalized.includes("json") || normalized.includes("fields:")) {
          return JSON.stringify(chosen);
        } else {
          return `"${chosen.tip}" — ${chosen.source}`;
        }
      }

      // 2. Symptom Checker (Section-based, highly customized clinical fallback)
      if (
        normalized.includes("symptom checker") || 
        normalized.includes("symptoms") || 
        normalized.includes("medical symptom") || 
        normalized.includes("patient configuration details") || 
        normalized.includes("section_1") || 
        normalized.includes("potential_causes")
      ) {
        const ageMatch = promptText.match(/(?:Age|aged)\s*[:]?\s*(\d+)/i);
        const age = ageMatch ? parseInt(ageMatch[1], 10) : 35;

        const genderMatch = promptText.match(/(?:Biological Gender|Gender|gender)\s*[:]?\s*(\w+)/i);
        const gender = genderMatch && genderMatch[1] ? genderMatch[1].trim() : "Unspecified";

        const symptomMatch = promptText.match(/(?:Primary Symptoms|Symptoms)\s*[:]?\s*([^\n]+)/i);
        const symptoms = symptomMatch && symptomMatch[1] ? symptomMatch[1].trim() : "general physical discomfort";

        const severityMatch = promptText.match(/(?:Severity)\s*[:]?\s*(\d+)/i);
        const severity = severityMatch ? parseInt(severityMatch[1], 10) : 5;

        const symptomsLower = symptoms.toLowerCase();
        let causes = "";
        let treatments = "";
        let prevention = "";
        let firstaid = "";
        let resources = "";

        if (
          symptomsLower.includes("fever") || 
          symptomsLower.includes("cough") || 
          symptomsLower.includes("flu") || 
          symptomsLower.includes("cold") || 
          symptomsLower.includes("throat")
        ) {
          causes = `## Possible Causes & Pathology
- **Viral Upper Respiratory Infection (Common Cold)**: Highly likely given standard respiratory symptom onset. Corresponds to mild self-limiting bronchial inflammation.
- **Influenza (Seasonal Flu)**: Suggested if onset was sudden and accompanied by moderate systemic body aches or chills.
- **Acute Bronchitis**: Mild airway passage congestion often trailing common viral profiles (as documented in CDC clinical guidelines).`;
          
          treatments = `## Evidence-Based Treatment Pathways
- **Symptomatic Relief**: Keep fever and aches low with over-the-counter paracetamol (acetaminophen) or ibuprofen, checking appropriate dosages with a pharmacist.
- **Supportive Therapies**: Warm water saline gargles (1/2 tsp salt in warm water) to soothe throat irritation, and steam inhalation or humidifiers to loosen nasal secretions.
- **Rest & Hydration**: Prioritize sleep and clear fluids (water, herbal tea) to keep mucous membranes moist and help the immune system filter pathogens.`;

          prevention = `## Preventive Care & Lifestyle Adjustments
- **Hygiene Measures**: Frequent hand-washing with soap for 20 seconds, or using an alcohol-based sanitizer, particularly before meals.
- **Vaccination Timing**: Schedule annual influenza vaccine and relevant pneumococcal or booster shots.
- **Airway Support**: Clean indoor air filters regularly and maintain hydration to preserve your respiratory tract's natural mucosal barrier.`;

          firstaid = `## First Aid & Critical Warning Red Flags
- **Difficulty Breathing**: Immediate medical attention is required if there is shortness of breath, wheezing, or feelings of chest tightness.
- **Persistent High Fever**: Fever above 103°F (39.4°C) that does not reduce with medication.
- **Emergency Indicators**: Bluish lips or face, confusion, or inability to stay awake are critical emergency indicators. Call emergency services (911/112) immediately.`;

          resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your Doctor:
1. "Given my respiratory symptoms, is a diagnostic throat swab or PCR panel indicated?"
2. "Are there underlying asthma or airway considerations we should review?"
3. "At what point should we evaluate for potential secondary bacterial infection?"

### Trustworthy Medical Directories:
| Platform | Search Reference Term | Clinical Scope |
| :--- | :--- | :--- |
| **Mayo Clinic** | Influenza & Common Cold | Clinical pathways, symptom relief, and home recovery |
| **CDC.gov** | Preventive Respiratory Guidance | Seasonal vaccination schedules and hygiene guidelines |
| **NHS UK** | Cough and Fever Care | Standard triage protocols and recovery timelines |`;
        } else if (symptomsLower.includes("headache") || symptomsLower.includes("migraine")) {
          causes = `## Possible Causes & Pathology
- **Tension Headache**: The most common primary headache type, typically presenting as a tight band of pressure around the head, often related to stress or posture.
- **Migraine Episode**: Indicated if the pain is unilateral, throbbing, or accompanied by sensory sensitivities (photophobia, phonophobia).
- **Dehydration Headache**: Triggered by systemic fluid deficits which affect intracranial vascular dynamics.`;

          treatments = `## Evidence-Based Treatment Pathways
- **Dark, Quiet Rest**: Seek absolute sensory decompression in a cooled, darkened room to down-regulate over-stimulated neural pathways.
- **Hydration Protocols**: Drink a large glass of water or electrolyte-balanced fluid slowly.
- **OTC Pharmacotherapy**: Administer non-steroidal anti-inflammatory drugs (NSAIDs) or paracetamol according to package guidelines, avoiding overuse to prevent medication-overuse headaches.`;

          prevention = `## Preventive Care & Lifestyle Adjustments
- **Symptom Diary**: Keep a precise diary recording sleep, food triggers (aged cheeses, processed meats), and caffeine intake to identify patterns.
- **Sleep Architecture**: Maintain a rigid, consistent sleep schedule, waking and resting at identical times daily.
- **Ergonomic Support**: Ensure correct neck alignment and computer screen height at work to minimize muscular tension.`;

          firstaid = `## First Aid & Critical Warning Red Flags
- **Thunderclap Onset**: Headaches that peak in intensity within seconds (sudden, explosive pain) require immediate emergency department evaluation.
- **Neurological Deficits**: Accompanying confusion, visual loss, double vision, speech difficulty, or weakness on one side of the body.
- **Meningeal Signs**: High fever accompanied by a rigid neck, nausea, and severe light sensitivity require urgent screening for meningitis.`;

          resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your Doctor:
1. "Does my headache profile suggest a primary migraine disorder?"
2. "Are preventive prescription therapies appropriate for my frequency?"
3. "Could my headaches be associated with medication overuse or neck strain?"

### Trustworthy Medical Directories:
| Platform | Search Reference Term | Clinical Scope |
| :--- | :--- | :--- |
| **Mayo Clinic** | Migraine & Tension Headaches | Diagnostic criteria, acute therapies, and lifestyle habits |
| **MedlinePlus** | Headache Management | Patient guides, trigger checklists, and warning signs |
| **NIH NINDS** | Headache Information Page | Comprehensive research-backed neurological explanations |`;
        } else if (
          symptomsLower.includes("pain") || 
          symptomsLower.includes("stomach") || 
          symptomsLower.includes("abdomen") || 
          symptomsLower.includes("nausea") || 
          symptomsLower.includes("diarrhea") || 
          symptomsLower.includes("vomit")
        ) {
          causes = `## Possible Causes & Pathology
- **Acute Gastroenteritis (Stomach Flu)**: Often viral or mild foodborne irritation, causing temporary bowel tract inflammation.
- **Dietary Indiscretion**: Gastrointestinal distress from food sensitivities, overly rich foods, or temporary digestive disruption.
- **Gastroesophageal Reflux (GERD)**: Acid backflow causing localized burning sensation in the upper epigastrium.`;

          treatments = `## Evidence-Based Treatment Pathways
- **Oral Rehydration**: Sip Oral Rehydration Salts (ORS) or water with electrolytes frequently in small quantities to offset fluid loss.
- **BRAT Diet Transition**: Once nausea subsides, introduce gentle foods like bananas, rice, applesauce, and plain toast.
- **Acid Buffering**: Utilize over-the-counter antacids or H2 blockers for localized upper stomach burning, following clinical instructions.`;

          prevention = `## Preventive Care & Lifestyle Adjustments
- **Food Hygiene**: Maintain sanitary food preparation surfaces, cook poultry thoroughly, and store perishables at proper cool temperatures.
- **Probiotic Support**: Consume fermented whole foods (yogurt, kefir) or high-quality dietary fibers to rebuild gut biome resilience.
- **Trigger Avoidance**: Eliminate carbonated drinks, excess caffeine, and spicy or greasy meals.`;

          firstaid = `## First Aid & Critical Warning Red Flags
- **Acute Localized Pain**: Severe, sharp, localized pain (such as the lower right quadrant, indicative of appendicitis) requires urgent evaluation.
- **Dehydration Indicators**: Inability to keep fluids down for over 24 hours, extreme thirst, dry mouth, or dark/infrequent urine.
- **Systemic Alarms**: Presence of blood in vomit or stools, or high fever with severe abdominal rigidity. Go to the ER immediately.`;

          resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your Doctor:
1. "Could my abdominal symptoms indicate a specific food intolerance or IBS?"
2. "Is a stool panel or diagnostic breath test indicated for persistent symptoms?"
3. "What specific hydration markers should we track in my blood work?"

### Trustworthy Medical Directories:
| Platform | Search Reference Term | Clinical Scope |
| :--- | :--- | :--- |
| **NIDDK NIH** | Gastroenteritis & Acid Reflux | Detailed physiological guides on digestion and stomach conditions |
| **Mayo Clinic** | Abdominal Pain Guide | Categorized pain mapping, home care, and warning signs |
| **CDC.gov** | Food Safety and Hygiene | Guidelines to prevent foodborne pathogens and stomach flu |`;
        } else {
          causes = `## Possible Causes & Pathology
- **Mild Physical Exertion Fatigue**: Temporary muscular or metabolic recovery response following exertion or systemic stress.
- **Minor Localized Irritation**: Non-specific tissue, dermatological, or muscular irritation, often self-limiting in nature.
- **Dehydration or Sleep Deficit**: Minor homeostatic imbalances that trigger general physical discomfort or fatigue.`;

          treatments = `## Evidence-Based Treatment Pathways
- **Relative Rest**: Allow the body a 24-48 hour window of lower physical demand to stimulate cellular self-repair.
- **Thermodynamics**: Apply cool compress packs for acute swelling, or warm packs to soothe stiff, tense muscles.
- **Sustained Hydration**: Drink pure water or electrolyte-fortified fluids to stabilize cellular fluid balances.`;

          prevention = `## Preventive Care & Lifestyle Adjustments
- **Sustained Sleep Quality**: Maintain a 7.5 to 8.5 hour nocturnal sleep window to maximize growth hormone release and nervous system repair.
- **Micro-Nutrient Stability**: Consume a balanced whole-foods diet rich in magnesium, leafy greens, and lean proteins.
- **Daily Recovery Routines**: Include active stretching, joint mobility routines, and 10 minutes of controlled diaphragmatic breathing daily.`;

          firstaid = `## First Aid & Critical Warning Red Flags
- **Acute Systemic Signs**: Sudden facial drooping, unilateral limb weakness, or severe speech difficulty require calling 911/112 immediately.
- **Unexplained Shortness of Breath**: Sudden onset of breathing difficulty or crushing chest pain radiating to the neck, jaw, or arm.
- **Loss of Orientation**: Feeling faint, sudden confusion, visual gaps, or inability to stand.`;

          resources = `## Doctor Screening Checkpoints & Verified Sources
### Questions for Your Doctor:
1. "What baseline blood markers (CBC, Vitamin D, Thyroid) should we screen?"
2. "How might my daily stress levels or sleep quality be impacting these symptoms?"
3. "Are there any physical activity limitations I should follow?"

### Trustworthy Medical Directories:
| Platform | Search Reference Term | Clinical Scope |
| :--- | :--- | :--- |
| **Mayo Clinic** | Symptom Assessment & Care | Clinical home care strategies, diagnostics, and prevention |
| **MedlinePlus** | General Wellness & Symptoms | Comprehensive, patient-friendly medical dictionaries and search |
| **NIH.gov** | Preventive Health Guidelines | Evidence-backed guides for daily longevity and disease prevention |`;
        }

        return `[SECTION_1: POTENTIAL_CAUSES]
${causes}

[SECTION_2: TREATMENT_PATHWAYS]
${treatments}

[SECTION_3: PREVENTION_STRATEGIES]
${prevention}

[SECTION_4: FIRST_AID_PROTOCOLS]
${firstaid}

[SECTION_5: CLINICAL_RESOURCES]
${resources}`;
      }

      // 3. Men's Health & Preventive Screening Guides
      if (
        normalized.includes("men's health") || 
        normalized.includes("screening and wellness guide") || 
        normalized.includes("male patient")
      ) {
        const ageMatch = promptText.match(/(?:Age|aged)\s*[:]?\s*(\d+)/i);
        const age = ageMatch ? parseInt(ageMatch[1], 10) : 45;

        const focusMatch = promptText.match(/(?:Primary Wellness Focus|Focus Area|focus)\s*[:]?\s*([a-zA-Z\s&-]+)/i);
        const focus = focusMatch && focusMatch[1] ? focusMatch[1].trim() : "Overall Longevity";

        const activityMatch = promptText.match(/(?:Activity State|Activity Level|activity)\s*[:]?\s*([a-zA-Z\s-]+)/i);
        const activity = activityMatch && activityMatch[1] ? activityMatch[1].trim() : "Moderately Active";

        const historyMatch = promptText.match(/(?:Hereditary History|Family History|history)\s*[:]?\s*([a-zA-Z\s-]+)/i);
        const history = historyMatch && historyMatch[1] ? historyMatch[1].trim() : "No known hereditary family history";

        // Build age-graded screening recommendations
        const screenTimeline = [];
        if (age >= 18) screenTimeline.push(`*   **Blood Pressure Assessment**: Recommended to check annually (Ideal target: below 120/80 mmHg). Essential to track cardiovascular resistance.`);
        if (age >= 20) screenTimeline.push(`*   **Lipid Panel / Cholesterol Test**: Every 4-6 years starting at age 20 to determine risk profiles for coronary atherosclerosis.`);
        if (age >= 35) screenTimeline.push(`*   **Type 2 Diabetes HbA1c Screening**: Every 3 years starting at age 35 to map fasting blood sugar trends and address prediabetic markers.`);
        if (age >= 45) {
          screenTimeline.push(`*   **Colorectal Cancer Screening**: Colonoscopy or home stool kits are standard starting at age 45. Essential for early precancerous polyp detection.`);
          screenTimeline.push(`*   **Prostate-Specific PSA Test**: Consult with your physician starting at age 45-50 to design an individual screening pathway.`);
        }
        if (age >= 50) screenTimeline.push(`*   **Shingles (Zoster) Vaccination**: Typically 2 doses starting at age 50 to maintain solid immune protection against viral nerve pain.`);
        if (age >= 65) screenTimeline.push(`*   **Pneumococcal Immunization**: Guidance recommends immunization at age 65 as an effective barrier against bacterial pneumonia.`);

        return `# PERSONALIZED MEN'S PREVENTIVE HEALTH REPORT

## 📋 Recommended Screenings & Preventive Timeline (Aged ${age})
${screenTimeline.length > 0 ? screenTimeline.join("\n") : "*   No explicit diagnostics triggered for this range. Consult with your practitioner."}

## ⚠️ Key Health Risks & Vulnerabilities
*   **Cardiovascular Integrity**: Factoring in your profile (Primary focus: ${focus}), supporting arterial health, managing blood pressure, and evaluating cholesterol remain critical core pillars.
*   **Metabolic Homeostasis**: A gradual physical change in baseline resting metabolism in the ${age}-year-old age group calls for balancing body composition to shield from insulin resistance.
*   **Hereditary Risks**: Based on profile details showing history of "${history}", prioritizing preventive family-graded checks with your doctor is highly commended.

## 🥗 Target Nutrition, Supplementation & Lifestyle Guidelines
*   **Dietary Guidance**: Transition toward an anti-inflammatory diet focusing on whole-food groups, leafy cruciferous greens, rich omega-3 fatty acids, and heart-healthy olive oil.
*   **Target Micro-nutrients**: Prioritize magnesium glycinate (300-400mg) for muscle recovery, Vitamin D3/K2 for bone and cardiovascular support, and direct functional cellular hydration.
*   **Physical Activity State (${activity})**: Tailor movement to elevate structural lean tissue density and bone mineralization through structured resistance circuits alongside low-intensity endurance walks.

## 🧠 Cognitive Support & Mental Health Considerations
*   **Stress Decompression**: Practice 10 minutes of active breathwork or diaphragmatic loops daily to lower blood pressure and cortisol levels.
*   **Sleep Optimization**: Maintain a regular bedtime window, keeping dark, cool environments (18-20°C) to maximize deep REM sleep states.

## 🩺 Doctor Consultation Checklist
1. "Should we check my baseline high-sensitivity C-reactive protein (hs-CRP) to evaluate cardiac inflammation levels?"
2. "Are physical risk markers triggering the need for a comprehensive metabolic panel or vitamin markers review?"
3. "Is a preventive colonoscopy or PSA baseline test recommended for my specific lifestyle and family background?"`;
      }

      // 4. Personalized Workout Planners
      if (
        normalized.includes("workout routine") || 
        normalized.includes("weekly workout planner") || 
        normalized.includes("fitness planner") || 
        normalized.includes("strength and conditioning") || 
        normalized.includes("training frequency")
      ) {
        const ageMatch = promptText.match(/(?:Age|aged)\s*[:]?\s*(\d+)/i);
        const age = ageMatch ? parseInt(ageMatch[1], 10) : 28;

        const genderMatch = promptText.match(/(?:Biological Gender|Gender|gender)\s*[:]?\s*(\w+)/i);
        const gender = genderMatch && genderMatch[1] ? genderMatch[1].trim() : "Male";

        const weightMatch = promptText.match(/(?:Weight|weight)\s*[:]?\s*(\d+)/i);
        const weight = weightMatch ? parseInt(weightMatch[1], 10) : 75;

        const heightMatch = promptText.match(/(?:Height|height)\s*[:]?\s*(\d+)/i);
        const height = heightMatch ? parseInt(heightMatch[1], 10) : 178;

        const goalMatch = promptText.match(/(?:Fitness Goal|Goal|goal)\s*[:]?\s*([a-zA-Z\s-]+)/i);
        const goal = goalMatch && goalMatch[1] ? goalMatch[1].trim() : "Muscle Gain";

        const levelMatch = promptText.match(/(?:Experience Level|Level|level)\s*[:]?\s*(\w+)/i);
        const level = levelMatch && levelMatch[1] ? levelMatch[1].trim() : "Intermediate";

        const daysMatch = promptText.match(/(?:Days per Week|Days|days)\s*[:]?\s*(\d+)/i);
        const days = daysMatch ? parseInt(daysMatch[1], 10) : 4;

        const envMatch = promptText.match(/(?:Environment|equipment|training environment)\s*[:]?\s*([a-zA-Z\s/]+)/i);
        const env = envMatch && envMatch[1] ? envMatch[1].trim() : "Commercial Gym";

        return `# ${goal.toUpperCase()} FITNESS AND WORKOUT ROUTINE
*Targeted Athlete Profile: ${age}-year-old ${gender} | Weight: ${weight}kg, Height: ${height}cm | Level: ${level}*

## 🗓️ Weekly Training Frequency Split (${days}-Day Split)
| Day | Target Focus | Action Type | Duration |
| :--- | :--- | :--- | :--- |
| **Day 1** | Primary Push Routine (Chest, Shoulders, Triceps) | Strength / Hypertrophy | 45-60 mins |
| **Day 2** | Primary Pull Routine (Back, Traps, Biceps) | Strength / Hypertrophy | 45-60 mins |
| **Day 3** | Active Recovery Mobility & Rest | Stretching / Light Cardio | 20-30 mins |
| **Day 4** | Primary Legs and Core Routine | Strength / Hypertrophy | 45-60 mins |
| **Day 5** | Cardiovascular Conditioning & HIIT | Metabolic Fitness | 30-40 mins |
| **Day 6** | Full Rest and Recovery | Muscle Repair | - |
| **Day 7** | Full Rest and Recovery | Muscle Repair | - |

## 🏋️ Routine Step-by-Step Breakdown (Designed for ${env})

### Session 1: Push Focus
*   **Warm-Up Protocol**:
    *   Dynamic upper extremity movements: 2 sets x 15 reps
    *   Resistance band chest openers: 2 sets x 12 reps
*   **Main Workout Block**:
    1.  **Dumbbell Flat Press**: 4 sets x 8-10 reps. Drive up from pectorals under complete eccentric control.
    2.  **Dumbbell Incline Press**: 3 sets x 10-12 reps. Targets upper clavicular pectoris.
    3.  **Seated Dumbbell Shoulder Press**: 3 sets x 10 reps. Keep shoulder joint in a safe natural slot.
    4.  **Dumbbell Lateral Raise**: 4 sets x 15 reps. Build rounded shoulders.
    5.  **Tricep Overhead Extensions**: 3 sets x 12 reps. Focus on forearm elbow extension.
*   **Cool-Down / Flexibility Plan**:
    *   Pec doorway stretch: 1 min
    *   Rotator cuff stretch: 1 min

### Session 2: Pull Focus
*   **Warm-Up Protocol**:
    *   Scapular retractions and rolls: 20 reps
    *   Band face pulls: 2 sets x 15 reps
*   **Main Workout Block**:
    1.  **Dumbbell Row (Bent Over)**: 4 sets x 8-10 reps. Pull towards the belly button to lock in the lower lats.
    2.  **Single-Arm Supported Row**: 3 sets x 12 reps. Isolate each side carefully.
    3.  **Dumbbell Incline Bicep Curl**: 3 sets x 12 reps. Complete biceps stretch.
    4.  **Rear Delt Flye (Prone/Seated)**: 3 sets x 15 reps. Strengthen upper back and scapular geometry.
*   **Cool-Down / Flexibility Plan**:
    *   Passive lat hangs on dead bar: 1 min
    *   Humble child's pose: 2 mins

### Session 3: Lower Body Focus
*   **Warm-Up Protocol**:
    *   Bodyweight squats: 2 sets x 15 reps
    *   Active hip opens (leg swings): 10 per leg
*   **Main Workout Block**:
    1.  **Goblet Squat (Dumbbell)**: 4 sets x 10 reps. Push through heels to keep knee stability.
    2.  **Dumbbell Romanian Deadlift (RDL)**: 3 sets x 10-12 reps. Drive hips back, focusing on high hamstring load.
    3.  **Dumbbell Walking Lunges**: 3 sets x 12 steps per leg. Great for hip stability and unilateral balance.
    4.  **Standing Calf Raises**: 4 sets x 15 reps. Isolate gastroc muscles.
*   **Cool-Down / Flexibility Plan**:
    *   Hip flexor kneeling stretch: 1 min per side
    *   Classic hamstring floor reach: 1 min

## 🥗 Nutrition & Fueling Protocols (Target: ${goal})
*   **Hydration Metric**: Keep consumption clean, tracking roughly 3.5 liters per active day.
*   **Amino Acid Pools**: Focus protein targets around 2.0g per kg of total body mass to accelerate structural tissue regrowth.
*   **Strategic Pre-Workout**: Easily digestible simple carbohydrates 45 mins before training (e.g. oatmeal or fresh fruit).
*   **Optimal Recovery Meal**: Clean carb and lean protein ratio within 90 minutes post-training.

## 📈 Progression & Recovery Philosophy
*   **Progressive Overload**: Aim to add one additional repetition or a small mass load to each movement set weekly.
*   **Systemic Rest**: Rest is where muscle grows. Prioritize 8 full hours of sleep to amplify growth hormone release and central nervous system repair.`;
      }

      // 5. Emergency & First Aid instructions
      if (
        normalized.includes("emergency") || 
        normalized.includes("first aid") || 
        normalized.includes("bite") || 
        normalized.includes("burn") || 
        normalized.includes("bite") || 
        normalized.includes("choking") || 
        normalized.includes("cpr")
      ) {
        return `# IMMEDIATE FIRST AID CARE EMERGENCY PROTOCOLS
*Disclaimer: This is preventative education context. If you are experiencing a life-threatening crisis, call emergency medical services immediately.*

## 🚨 Essential Scene Assessment Actions
1.  **Survey for Safety**: Immediately check for hazardous objects, moving vehicles, live high voltage cables, or risk factors.
2.  **Verify Responsiveness**: Tap the victim's shoulder and ask "Are you okay?" loudly for response.
3.  **Summon Assistance**: Loudly instruct near bystanders to call emergency services and locate an AED.

## 🩹 Important Common First Aid Procedures

### 1. Cardiopulmonary Resuscitation (CPR)
*   Ensure patient is lying flat on a firm, leveled surface.
*   Place the heel of one hand in the dead center of the patient's breastbone, interlacing other hand on top.
*   Perform hard chest compressions: 2 inches deep, rate of 100-120 per minute (e.g. Stayin' Alive tempo).
*   Deliver 30 compressions followed by 2 quick rescue breaths (if trained). Otherwise, continue continuous chest-only compression therapy.

### 2. Controlling Serious Exterior Bleeding
*   Apply firm direct pressure over injury using sterile thick dressings or tight clean cloth.
*   Raise the bleeding limb above the physical heart line to counter hydrostatic arterial pressure.
*   If bleeding continues, deploy a professional tourniquet 2-3 inches above the wound. Keep tight until the bleeding stops completely. Note exact time of locking.

### 3. Immediate Thermal Burns Care
*   Place the burn area under gentle cold running water for 15-20 mins. Cold water assists in pulling heat from superficial cells.
*   Cover burn loosely with clean kitchen cling film or non-stick sterile material. Do not break skin blisters.
*   Avoid adding butter, kitchen paste, oil, or chemical spray, which seal thermal energy and worsen infection.

### 4. Insect Stings and Animal Bites
*   Wash the bite site with soap and flowing water. Use a flat card to slide and detach stingers. Do not squeeze with tweezers.
*   Apply cold compress packs to mitigate swelling. Monitor close for systemic allergy symptoms.`;
      }

      // 6. Default Fallback
      return `### PulsePoint Healthcare Support Agent
Our backend clinical intelligence network is presently experiencing a massive spike in requests (rate limit/service high demand). Standard services remain operational. Here is helpful, foundational health advice for your reference:

- **Wellness Targets**: Maintain 150 minutes of moderate aerobic workouts weekly, limit processed simple sugars, and aim for 7.5 to 8.5 hours of solid rest nightly.
- **Physical Safety**: If you are dealing with critical signs such as heavy chest compression pain, unexplained short breath, sudden facial drop, or limb numbness, contact emergency responders immediately.
- **Health Tools**: Utilize our offline-capable BMI, Heart Rate, pregnancy trackers, or water loggers on this platform. Please submit your exact query once network demand levels stabilize!`;

    } catch (err: any) {
      console.warn("Exception in getAIGenerationFallback:", err);
      return `### PulsePoint Healthcare Support Agent
Our backend clinical intelligence network is temporarily offline. Please contact local clinical providers or emergency responders (911) if you are experiencing an urgent physical crisis. For general wellness tracking, you can use our built-in offline-capable water logs, activity logs, and calculators safely.`;
    }
  }

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined. Using robust local fallback generator.");
      try {
        const fallbackText = getAIGenerationFallback(contents);
        return res.json({ text: fallbackText });
      } catch (fallbackError: any) {
        console.warn("Local fallback generation failed:", fallbackError?.message || fallbackError);
        return res.status(500).json({ error: "Failed to generate local content" });
      }
    }

    try {
      const ai = getAIClient();
      
      // Standardize on the modern, high-performance gemini-3.5-flash model
      let targetModel = model || "gemini-3.5-flash";
      
      const prohibitedOrDeprecated = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
        "gemini-2.0-flash",
        "gemini-2.0-pro",
        "gemini-2.0-flash-thinking",
        "gemini-2.5-flash"
      ];
      if (prohibitedOrDeprecated.includes(targetModel)) {
        targetModel = "gemini-3.5-flash";
      }

      console.log(`Backend proxy: Generating content using model ${targetModel}`);
      const apiCallPromise = ai.models.generateContent({
        model: targetModel,
        contents,
        config,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout: Gemini API request timed out after 45000ms")), 45000);
      });

      const response = await Promise.race([apiCallPromise, timeoutPromise]);

      res.json({ 
        text: response.text,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      });
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      const isQuota = errMsg.includes("quota") || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || error?.status === "RESOURCE_EXHAUSTED" || error?.status === 429;
      if (isQuota) {
        console.log("[Gemini Proxy] Quota/Rate Limit Exceeded. Utilizing local fallback generator.");
      } else {
        console.log(`[Gemini Proxy] API unavailable/experiencing high demand. Utilizing local fallback generator.`);
      }
      try {
        const fallbackText = getAIGenerationFallback(contents);
        res.json({ text: fallbackText });
      } catch (fallbackError: any) {
        console.log(`[Gemini Proxy] Local fallback generation failed: ${fallbackError?.message || fallbackError}`);
        res.status(200).json({ text: "Our clinical support system is currently offline. Please try again shortly or seek a local provider directly." });
      }
    }
  });

  // Proxy to fetch real facilities near the coordinates using official Google Maps Platform APIs with fallback options
  app.post("/api/facilities", async (req, res) => {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "lat and lng are required fields" });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY || "";

    // 1. Primary: Use gemini-3.5-flash with the googleMaps tool for high-fidelity maps grounding
    try {
      console.log(`[Google Maps Grounding] Requesting Gemini maps grounding search near coordinates: ${userLat}, ${userLng}`);
      const ai = getAIClient();
      const apiCallPromise = ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Find real medical facilities (including general hospitals, urgent clinics, pharmacies/chemists, dental clinics, specialty doctor offices like pediatrics/cardiology, and diagnostic imaging/laboratory centers) near coordinates ${userLat}, ${userLng}. 
        Prioritize facilities with active ratings or 24/7 service if available, offering a diverse list representing all these types if they exist near the location.
        Please return the list as a JSON array of objects inside a \`\`\`json markdown block. Each object must have these fields:
        - name: string (the exact full name)
        - address: string (full street address)
        - type: "hospital" | "clinic" | "pharmacy" | "dental" | "specialty" | "diagnostic"
        - mapsUrl: string (direct Google Maps link)
        - lat: number (latitude of the facility)
        - lng: number (longitude of the facility)
        - reviews: array of strings (Google rating or helpful snippet, e.g. ["Google Rating: 4.6 ⭐ (120 reviews)", "Highly responsive emergency desk."])
        
        Do not add any conversational intro or outro text, only output the JSON array inside the \`\`\`json markdown block.`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: userLat,
                longitude: userLng
              }
            }
          }
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout: Gemini Maps Grounding request timed out after 45000ms")), 45000);
      });

      const response = await Promise.race([apiCallPromise, timeoutPromise]);

      let text = response.text || "";
      let facilities = [];
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
      try {
        facilities = JSON.parse(jsonStr);
      } catch (parseErr) {
        console.warn("Failed to parse Gemini output as JSON, trying more permissive extraction:", parseErr);
        const startIdx = jsonStr.indexOf("[");
        const endIdx = jsonStr.lastIndexOf("]");
        if (startIdx !== -1 && endIdx !== -1) {
          try {
            facilities = JSON.parse(jsonStr.substring(startIdx, endIdx + 1));
          } catch (e) {
            console.error("Permissive extraction failed:", e);
          }
        }
      }

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const groundingSources = chunks
        .map((chunk: any) => {
          if (chunk.maps) {
            return {
              title: chunk.maps.title || "",
              uri: chunk.maps.uri || "",
              reviewSnippets: chunk.maps.placeAnswerSources?.map((source: any) => source.reviewSnippets).flat().filter(Boolean) || []
            };
          }
          return null;
        })
        .filter(Boolean);

      if (Array.isArray(facilities) && facilities.length > 0) {
        const mapped = facilities.map((f: any) => {
          const fLat = f.lat || userLat;
          const fLng = f.lng || userLng;
          const distanceMeter = calculateDistance(userLat, userLng, fLat, fLng);
          
          let facilityType: string = 'hospital';
          const t = String(f.type || '').toLowerCase();
          const n = String(f.name || '').toLowerCase();
          if (t.includes('pharmacy') || t.includes('chemist') || t.includes('drugstore') || n.includes('pharmacy')) {
            facilityType = 'pharmacy';
          } else if (t.includes('dental') || t.includes('dentist') || t.includes('orthodont') || n.includes('dental') || n.includes('dentist')) {
            facilityType = 'dental';
          } else if (t.includes('diagnostic') || t.includes('lab') || t.includes('scan') || t.includes('imaging') || t.includes('pathology') || n.includes('diagnostic') || n.includes('lab') || n.includes('scan') || n.includes('imaging') || n.includes('pathology') || n.includes('x-ray') || n.includes('xray')) {
            facilityType = 'diagnostic';
          } else if (t.includes('special') || t.includes('cardio') || t.includes('pediatric') || t.includes('maternity') || t.includes('eye') || t.includes('oncology') || n.includes('special') || n.includes('cardio') || n.includes('pediatric') || n.includes('maternity') || n.includes('eye') || n.includes('heart') || n.includes('skin') || n.includes('derma')) {
            facilityType = 'specialty';
          } else if (t.includes('clinic') || t.includes('medical center') || t.includes('medical centre') || t.includes('health') || t.includes('urgent') || n.includes('clinic') || n.includes('health centre') || n.includes('health center')) {
            facilityType = 'clinic';
          }

          // Try to find matching grounding chunk for mapsUrl or reviews fallback
          let mapsUrl = f.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((f.name || '') + ' ' + (f.address || ''))}`;
          const matchingChunk = groundingSources.find((src: any) => 
            (src.title && f.name && (src.title.toLowerCase().includes(f.name.toLowerCase()) || f.name.toLowerCase().includes(src.title.toLowerCase())))
          );
          if (matchingChunk && matchingChunk.uri) {
            mapsUrl = matchingChunk.uri;
          }

          return {
            name: f.name || "Unknown Facility",
            address: f.address || "Address not available",
            type: facilityType,
            mapsUrl: mapsUrl,
            lat: fLat,
            lng: fLng,
            distanceMeter,
            distanceDisplay: distanceMeter > 1000 
              ? `${(distanceMeter / 1000).toFixed(1)} km` 
              : `${Math.round(distanceMeter)} m`,
            reviews: Array.isArray(f.reviews) ? f.reviews : []
          };
        }).sort((a: any, b: any) => (a.distanceMeter || 0) - (b.distanceMeter || 0));

        return res.json({
          facilities: mapped,
          groundingSources: groundingSources
        });
      }
    } catch (geminiMapsError) {
      console.log("[Google Maps Grounding] Gemini tool unavailable. Shifting to standard Place search fallback.");
    }

    // 2. Fallback A: If API Key is present, attempt live Google Maps Platform Nearby Search + Distance Matrix
    if (apiKey && apiKey !== "YOUR_API_KEY") {
      try {
        console.log(`[Google Maps Integration] Finding facilities near ${userLat}, ${userLng}`);
        // Nearby Search API (restricted to hospitals, clinic as keyword)
        const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${userLat},${userLng}&radius=15000&type=hospital&keyword=clinic&key=${apiKey}`;
        const placesResponse = await fetch(placesUrl);
        
        if (!placesResponse.ok) {
          throw new Error(`Google Places API returned status: ${placesResponse.status}`);
        }

        const placesData = (await placesResponse.json()) as any;

        if (placesData.status === "OK" && Array.isArray(placesData.results) && placesData.results.length > 0) {
          // Limit to top 10 facilities to keep Distance Matrix API calculations lightweight and under budget
          const rawResults = placesData.results.slice(0, 10);
          const destinations = rawResults.map((p: any) => `${p.geometry.location.lat},${p.geometry.location.lng}`).join("|");

          // Distance Matrix API for true driving distance and duration
          const dmUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${userLat},${userLng}&destinations=${encodeURIComponent(destinations)}&mode=driving&key=${apiKey}`;
          const dmResponse = await fetch(dmUrl);
          
          let dmData: any = null;
          if (dmResponse.ok) {
            dmData = await dmResponse.json();
          }

          const mapped = rawResults.map((p: any, idx: number) => {
            const pLat = p.geometry.location.lat;
            const pLng = p.geometry.location.lng;

            // Compute geometric distance as a reliable fallback
            let distanceMeter = calculateDistance(userLat, userLng, pLat, pLng);
            let distanceDisplay = distanceMeter > 1000 
              ? `${(distanceMeter / 1000).toFixed(1)} km` 
              : `${Math.round(distanceMeter)} m`;
            let durationDisplay = "";

            // Override with real driving matrix travel data if successful
            if (dmData && dmData.status === "OK" && dmData.rows?.[0]?.elements?.[idx]) {
              const element = dmData.rows[0].elements[idx];
              if (element.status === "OK") {
                distanceMeter = element.distance.value;
                distanceDisplay = element.distance.text;
                durationDisplay = element.duration.text;
              }
            }

            let facilityType: string = 'hospital';
            const nameLower = p.name.toLowerCase();
            if (nameLower.includes("pharmacy") || nameLower.includes("chemist") || nameLower.includes("drugstore")) {
              facilityType = "pharmacy";
            } else if (nameLower.includes("dental") || nameLower.includes("dentist") || nameLower.includes("orthodont")) {
              facilityType = "dental";
            } else if (nameLower.includes("diagnostic") || nameLower.includes("lab") || nameLower.includes("scan") || nameLower.includes("imaging") || nameLower.includes("pathology") || nameLower.includes("x-ray") || nameLower.includes("xray")) {
              facilityType = "diagnostic";
            } else if (nameLower.includes("specialist") || nameLower.includes("cardio") || nameLower.includes("pediatric") || nameLower.includes("maternity") || nameLower.includes("eye") || nameLower.includes("heart") || nameLower.includes("skin") || nameLower.includes("derma") || nameLower.includes("oncology")) {
              facilityType = "specialty";
            } else if (nameLower.includes("clinic") || nameLower.includes("medical centre") || nameLower.includes("health") || nameLower.includes("dispensary") || nameLower.includes("medical center")) {
              facilityType = "clinic";
            }

            return {
              name: p.name,
              address: p.vicinity || p.formatted_address || "Address not available",
              type: facilityType,
              mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}&query_place_id=${p.place_id}`,
              lat: pLat,
              lng: pLng,
              distanceMeter,
              distanceDisplay,
              durationDisplay,
              reviews: p.rating ? [`Google Rating: ${p.rating} ⭐ (${p.user_ratings_total || 0} reviews)`] : []
            };
          });

          // Rank sorted by distance
          mapped.sort((a: any, b: any) => (a.distanceMeter || 0) - (b.distanceMeter || 0));
          return res.json({
            facilities: mapped,
            groundingSources: []
          });
        } else {
          console.warn(`[Google Maps Integration] Places Search returned status: ${placesData.status}. Shifting to fallback.`);
        }
      } catch (gmpError) {
        console.error("Error using Google Maps APIs on backend:", gmpError);
      }
    }

    // 3. Fallback B: Fully authentic, located medical facilities in Kampala, Uganda with rich diversity
    const fallbackFacilities = [
      {
        name: "Mulago National Referral Hospital",
        address: "Mulago Hill Road, Kampala, Uganda",
        type: "hospital" as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=Mulago+National+Referral+Hospital+Kampala`,
        lat: 0.3378,
        lng: 32.5761,
        reviews: ["Uganda's premier national referral and teaching hospital.", "24/7 active emergency department."]
      },
      {
        name: "Nakasero Hospital",
        address: "14A Akii Bua Road, Nakasero, Kampala, Uganda",
        type: "hospital" as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=Nakasero+Hospital+Kampala`,
        lat: 0.3265,
        lng: 32.5815,
        reviews: ["Highly rated premium private health facility.", "Very clean, professional doctors and brief wait times."]
      },
      {
        name: "Jubilee Dental Clinic",
        address: "Plot 30, Jinja Road, Kampala, Uganda",
        type: "dental" as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=Jubilee+Dental+Clinic+Kampala`,
        lat: 0.3155,
        lng: 32.5892,
        reviews: ["State of the art dental implants & orthodontics.", "Highly rated patient care and hygiene standards."]
      },
      {
        name: "Kampala Imaging Centre (KIC)",
        address: "Plot 12, George Street, Kampala, Uganda",
        type: "diagnostic" as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=Kampala+Imaging+Centre+George+Street`,
        lat: 0.3204,
        lng: 32.5755,
        reviews: ["Advanced MRI, 3D/4D Ultrasound, and CT Scan diagnostics.", "Prompt lab results and digital reporting."]
      },
      {
        name: "The Surgery Uganda",
        address: "21 Luthuli Avenue, Bugolobi, Kampala, Uganda",
        type: "clinic" as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=The+Surgery+Uganda+Kampala`,
        lat: 0.3168,
        lng: 32.6105,
        reviews: ["Excellent 24-hour emergency response and ambulance services.", "Highly professional and experienced crew."]
      },
      {
        name: "Kampala Hospital Kololo",
        address: "6 Shimon Road, Kololo, Kampala, Uganda",
        type: "hospital" as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=Kampala+Hospital+Kololo`,
        lat: 0.3315,
        lng: 32.5912,
        reviews: ["Conveniently situated in quiet Kololo.", "Equipped with state-of-the-art diagnostic imaging scanners."]
      },
      {
        name: "Children's Clinic Kampala",
        address: "Plot 15, Yusuf Lule Road, Kampala, Uganda",
        type: "specialty" as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=Childrens+Clinic+Yusuf+Lule+Kampala`,
        lat: 0.3290,
        lng: 32.5855,
        reviews: ["Specialized pediatric doctors & newborn wellness programs.", "Friendly environment for young patients."]
      },
      {
        name: "Lancet Laboratories Uganda",
        address: "Plot 61-67, Buganda Road, Kampala, Uganda",
        type: "diagnostic" as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=Lancet+Laboratories+Buganda+Road+Kampala`,
        lat: 0.3238,
        lng: 32.5790,
        reviews: ["ISO certified diagnostic medical laboratory.", "Online results retrieval with accurate path analysis."]
      },
      {
        name: "Case Medical Centre",
        address: "69/71 Buganda Road, Kampala, Uganda",
        type: "clinic" as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=Case+Medical+Centre+Kampala`,
        lat: 0.3242,
        lng: 32.5786,
        reviews: ["Clean clinics, reliable full lab and pharmacy services."]
      },
      {
        name: "Pan Dental Surgery Kololo",
        address: "Plot 4, Acacia Avenue, Kololo, Kampala, Uganda",
        type: "dental" as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=Pan+Dental+Surgery+Acacia+Avenue+Kampala`,
        lat: 0.3352,
        lng: 32.5878,
        reviews: ["Leading dental care provider with specialists in cosmetic dentistry.", "Very friendly staff and clean private rooms."]
      },
      {
        name: "First Pharmacy Wandegeya",
        address: "Bombo Road, Wandegeya, Kampala, Uganda",
        type: "pharmacy" as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=First+Pharmacy+Wandegeya+Kampala`,
        lat: 0.3320,
        lng: 32.5730,
        reviews: ["Well-stocked, highly reliable 24-hour chemist and dispensary."]
      },
      {
        name: "Mbarara Regional Referral Hospital",
        address: "Mbarara-Kabale Road, Mbarara, Uganda",
        type: "hospital" as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=Mbarara+Regional+Referral+Hospital`,
        lat: -0.6151,
        lng: 30.6558,
        reviews: ["Major teaching and referral hospital in Western Uganda.", "Spacious diagnostic and surgical wards."]
      },
      {
        name: "Gulu Regional Referral Hospital",
        address: "Hospital Road, Gulu, Uganda",
        type: "hospital" as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=Gulu+Regional+Referral+Hospital`,
        lat: 2.7725,
        lng: 32.3006,
        reviews: ["Primary public referral health center in Northern Uganda.", "24/7 critical emergency and pediatric departments."]
      },
      {
        name: "Jinja Regional Referral Hospital",
        address: "Clifton Road, Jinja, Uganda",
        type: "hospital" as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=Jinja+Regional+Referral+Hospital`,
        lat: 0.4283,
        lng: 33.2045,
        reviews: ["Large-scale public medical center in Eastern Uganda.", "Fully equipped maternity and surgical operations."]
      },
      {
        name: "St. Mary's Hospital Lacor",
        address: "Gulu-Nimule Road, Gulu, Uganda",
        type: "hospital" as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=St.+Marys+Hospital+Lacor+Gulu`,
        lat: 2.7611,
        lng: 32.2589,
        reviews: ["Highly regarded mission-based private hospital with premium facilities.", "Affordable care, prompt treatment, and complete laboratory diagnostics."]
      },
      {
        name: "Fort Portal Regional Referral Hospital",
        address: "Fort Portal-Kasese Road, Fort Portal, Uganda",
        type: "hospital" as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=Fort+Portal+Regional+Referral+Hospital`,
        lat: 0.6525,
        lng: 30.2747,
        reviews: ["Strategic referral center serving the Rwenzori sub-region.", "Professional clinical staff and emergency triage."]
      },
      {
        name: "Mbale Regional Referral Hospital",
        address: "Pallisa Road, Mbale, Uganda",
        type: "hospital" as const,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=Mbale+Regional+Referral+Hospital`,
        lat: 1.0744,
        lng: 34.1758,
        reviews: ["Leading tertiary hospital in Mount Elgon region.", "Highly active outpatient and neonatal clinics."]
      }
    ];

    const mapped = fallbackFacilities.map(f => {
      const distanceMeter = calculateDistance(userLat, userLng, f.lat, f.lng);
      return {
        ...f,
        distanceMeter,
        distanceDisplay: distanceMeter > 1000 
          ? `${(distanceMeter / 1000).toFixed(1)} km` 
          : `${Math.round(distanceMeter)} m`
      };
    }).sort((a, b) => a.distanceMeter - b.distanceMeter);

    res.json({
      facilities: mapped,
      groundingSources: []
    });
  });

  // Advice and personalized search recommendations powered by Google Maps grounding and Gemini intelligence
  app.post("/api/facilities/search-advice", async (req, res) => {
    const { query: searchQuery, lat, lng } = req.body;
    if (!searchQuery) {
      return res.status(400).json({ error: "query is required" });
    }

    const userLat = lat ? parseFloat(lat) : 0.3476; // Default to Kampala if user coords not passed
    const userLng = lng ? parseFloat(lng) : 32.5825;

    try {
      console.log(`[Search Advice] Query: "${searchQuery}" near location: ${userLat}, ${userLng}`);
      
      // Query verified partner hospitals from Firestore
      const dbHospitals = await getHospitalsFromDb();
      const dbHospitalsStr = dbHospitals.length > 0 
        ? JSON.stringify(dbHospitals.map(h => ({
            name: h.name,
            address: h.address,
            services: h.services || [],
            openingHours: h.openingHours || "24/7",
            lat: h.location?.lat,
            lng: h.location?.lng,
            phone: h.contactPhone,
            email: h.contactEmail
          })))
        : "None registered in database yet.";

      const ai = getAIClient();
      const prompt = `You are an empathetic, professional medical facility locator and clinical support advisor.
      The patient has entered the search query/medical concern: "${searchQuery}"
      The patient's current GPS coordinates are: Latitude ${userLat}, Longitude ${userLng}.
      
      Here is a list of our verified "Partner Hospitals" stored in our database backend:
      ${dbHospitalsStr}
      
      Using Google Maps Grounding AND the list of Partner Hospitals provided above, find relevant medical facilities near their coordinates that best address their specific issue or search query.
      - If one of our "Partner Hospitals" is highly relevant (e.g., they need a hospital, clinic, or specialized surgery/service offered by that partner), you MUST prioritize recommending and including that Partner Hospital in your response, advice, and the facilities list!
      - If they describe a symptom (e.g., severe toothache), prioritize specialized providers (e.g., dental clinics).
      - If they describe an emergency (e.g., chest pain, high fever), prioritize general hospitals with active ER or 24/7 care.
      - If they search for a service (e.g., pharmacy, lab test, ultrasound), prioritize pharmacies, labs, or diagnostic centers.
      
      Formulate your response as a JSON object containing two fields:
      1. "advice": A string containing warm, professional, compassionate medical guidance and advice in clear markdown. First, give immediate educational feedback about their query/symptom (including a friendly disclaimer that this is AI-powered support and not a substitute for professional medical care). Then, explain why the selected facilities are highly suited to help, and list what they should do or bring (e.g., medical history, ID).
      2. "facilities": A JSON array of the matching medical facilities found via Google Maps. Each object MUST contain:
         - "name": string (full official name of the facility)
         - "address": string (street address)
         - "type": "hospital" | "clinic" | "pharmacy" | "dental" | "specialty" | "diagnostic"
         - "mapsUrl": string (direct Google Maps URL)
         - "lat": number (latitude)
         - "lng": number (longitude)
         - "reviews": array of strings (such as ratings or helpful snippets)
         
      Please output ONLY the JSON object inside a \`\`\`json markdown block. Do not add any conversational text before or after the markdown block.`;

      const apiCallPromise = ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: userLat,
                longitude: userLng
              }
            }
          }
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout: Gemini Search Advice request timed out after 45000ms")), 45000);
      });

      const response = await Promise.race([apiCallPromise, timeoutPromise]);
      const text = response.text || "";

      let adviceData: any = { advice: "", facilities: [] };
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
      
      try {
        adviceData = JSON.parse(jsonStr);
      } catch (parseErr) {
        console.warn("Failed to parse advice output as JSON:", parseErr);
        const startIdx = jsonStr.indexOf("{");
        const endIdx = jsonStr.lastIndexOf("}");
        if (startIdx !== -1 && endIdx !== -1) {
          try {
            adviceData = JSON.parse(jsonStr.substring(startIdx, endIdx + 1));
          } catch (e) {
            console.error("Permissive extraction of advice failed:", e);
          }
        }
      }

      if (!adviceData.advice) {
        adviceData.advice = "Here is some helpful guidance based on your query. Please note that this is an automated AI support advisor. For any immediate medical emergencies, please visit the nearest emergency room immediately.";
      }

      if (Array.isArray(adviceData.facilities) && adviceData.facilities.length > 0) {
        adviceData.facilities = adviceData.facilities.map((f: any) => {
          const fLat = f.lat || userLat;
          const fLng = f.lng || userLng;
          const distanceMeter = calculateDistance(userLat, userLng, fLat, fLng);
          return {
            name: f.name || "Unknown Facility",
            address: f.address || "Address not available",
            type: f.type || "hospital",
            mapsUrl: f.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((f.name || '') + ' ' + (f.address || ''))}`,
            lat: fLat,
            lng: fLng,
            distanceMeter,
            distanceDisplay: distanceMeter > 1000 
              ? `${(distanceMeter / 1000).toFixed(1)} km` 
              : `${Math.round(distanceMeter)} m`,
            reviews: Array.isArray(f.reviews) ? f.reviews : []
          };
        }).sort((a: any, b: any) => (a.distanceMeter || 0) - (b.distanceMeter || 0));
      } else {
        const queryLower = searchQuery.toLowerCase();
        const fallbackList = [
          {
            name: "Mulago National Referral Hospital",
            address: "Mulago Hill, Kampala, Uganda",
            type: "hospital",
            lat: 0.3382,
            lng: 32.5761,
            reviews: ["National level referral clinical support."]
          },
          {
            name: "IHK (International Hospital Kampala)",
            address: "Plot 4686, Barnabas Road, Kisugu, Namuwongo, Kampala, Uganda",
            type: "hospital",
            lat: 0.3112,
            lng: 32.6105,
            reviews: ["Highly rated premium private health facility."]
          },
          {
            name: "Jubilee Dental Clinic",
            address: "Plot 30, Jinja Road, Kampala, Uganda",
            type: "dental",
            lat: 0.3155,
            lng: 32.5892,
            reviews: ["State of the art dental implants & orthodontics."]
          },
          {
            name: "Kampala Imaging Centre (KIC)",
            address: "Plot 12, George Street, Kampala, Uganda",
            type: "diagnostic",
            lat: 0.3204,
            lng: 32.5755,
            reviews: ["Advanced MRI, 3D/4D Ultrasound, and CT Scan diagnostics."]
          },
          {
            name: "The Surgery Uganda",
            address: "21 Luthuli Avenue, Bugolobi, Kampala, Uganda",
            type: "clinic",
            lat: 0.3182,
            lng: 32.6120,
            reviews: ["Excellent 24-hour emergency response."]
          }
        ];

        const matchedFallback = fallbackList.filter(f => 
          f.name.toLowerCase().includes(queryLower) || 
          f.type.toLowerCase().includes(queryLower) ||
          (queryLower.includes("dent") && f.type === "dental") ||
          (queryLower.includes("tooth") && f.type === "dental") ||
          (queryLower.includes("teeth") && f.type === "dental") ||
          (queryLower.includes("emergency") && (f.type === "hospital" || f.type === "clinic")) ||
          (queryLower.includes("er") && (f.type === "hospital" || f.type === "clinic")) ||
          (queryLower.includes("scan") && f.type === "diagnostic") ||
          (queryLower.includes("xray") && f.type === "diagnostic") ||
          (queryLower.includes("lab") && f.type === "diagnostic")
        );

        const listToUse = matchedFallback.length > 0 ? matchedFallback : fallbackList.slice(0, 3);
        adviceData.facilities = listToUse.map((f: any) => {
          const distanceMeter = calculateDistance(userLat, userLng, f.lat, f.lng);
          return {
            ...f,
            mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.name + " " + f.address)}`,
            distanceMeter,
            distanceDisplay: distanceMeter > 1000 
              ? `${(distanceMeter / 1000).toFixed(1)} km` 
              : `${Math.round(distanceMeter)} m`
          };
        });
      }

      res.json(adviceData);
    } catch (err: any) {
      console.log(`[Gemini Advice] Utilizing local fallback advisor due to API limit/unavailable: ${err?.message || err}`);
      res.json({
        advice: `### Medical Facility Locator Assistant\n\nI encountered a brief connection error, but I can guide you. Based on your search for **"${searchQuery}"**, here are some of our verified local medical facilities near you. For any severe symptoms, chest pain, or trauma, please seek immediate emergency care at the nearest hospital.\n\n*What to bring: your identification, previous prescriptions, and any insurance credentials.*`,
        facilities: [
          {
            name: "Mulago National Referral Hospital",
            address: "Mulago Hill, Kampala, Uganda",
            type: "hospital",
            mapsUrl: "https://www.google.com/maps/search/?api=1&query=Mulago+National+Referral+Hospital+Kampala",
            distanceDisplay: "Calculated dynamically",
            reviews: ["24/7 National Emergency Center"]
          },
          {
            name: "The Surgery Uganda",
            address: "21 Luthuli Avenue, Bugolobi, Kampala, Uganda",
            type: "clinic",
            mapsUrl: "https://www.google.com/maps/search/?api=1&query=The+Surgery+Uganda+Bugolobi",
            distanceDisplay: "Calculated dynamically",
            reviews: ["24-Hour Medical Center & Ambulance"]
          }
        ]
      });
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

  httpServer.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await seedHospitalsIfEmpty();
  });
}

startServer();
