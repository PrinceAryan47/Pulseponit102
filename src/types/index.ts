export type UserRole = 'patient' | 'doctor';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  fullName: string;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: string;
  
  // Patient specific
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  allergies?: string;
  conditions?: string;
  city?: string;
  
  // Doctor/Admin specific
  licenseNumber?: string;
  specialization?: string;
  experience?: number;
  qualifications?: string;
  hospitalId?: string;
  hospitalName?: string;
  status?: UserStatus;
  licenseVerificationStatus?: 'pending' | 'verified' | 'rejected';
  hospitalApprovalStatus?: 'pending' | 'approved' | 'rejected';
  availability?: Record<string, string[]>;
  isOnline?: boolean;
  lastSeen?: string;
  workplace?: {
    hospitalName?: string;
    description?: string;
    beds?: string;
    specialists?: string;
    department?: string;
    floor?: string;
    room?: string;
    workingHoursWeekday?: string;
    workingHoursSaturday?: string;
  };
}

export interface Hospital {
  id: string;
  name: string;
  licenseNumber: string;
  address: string;
  location?: { lat: number; lng: number };
  contactPhone: string;
  contactEmail: string;
  services: string[];
  openingHours: string;
  photoURL?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  dateTime: string;
  status: 'pending' | 'confirmed' | 'accepted' | 'rejected' | 'completed';
  notes?: string;
  doctorNote?: string;
  doctorNotes?: string;
  
  // Joined data for UI
  patientName?: string;
  doctorName?: string;
  hospitalName?: string;
  meetingLink?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  diagnosis: string;
  prescription?: string;
  labResults?: string;
  notes?: string;
  attachments?: string[];
  
  // Joined data
  doctorName?: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  authorId: string;
  category: string;
  imageURL?: string;
  createdAt: string;
  authorName?: string;
  sourceName?: string;
  sourceUrl?: string;
  likes?: string[];
  comments?: {
    userId: string;
    userName: string;
    text: string;
    createdAt: string;
  }[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'message' | 'alert';
  read: boolean;
  createdAt: string;
}
