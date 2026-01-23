// Backend Type Definitions

// User Types
export interface User {
  id: string;
  email: string;
  role: 'elder' | 'guardian';
  profile: any;
  createdAt: Date;
  updatedAt: Date;
}

// Request Types
export interface AuthRequest {
  email: string;
  password: string;
  role?: 'elder' | 'guardian';
  profile?: any;
}

export interface EmergencyRequest {
  type: 'sos' | 'fall' | 'keyword' | 'inactivity';
  location?: {
    latitude: number;
    longitude: number;
  };
  audioData?: string;
  detectionConfidence?: number;
  notes?: string;
}

export interface MedicineRequest {
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface SyncRequest {
  medicines?: any[];
  tasks?: any[];
  moods?: any[];
  emergencies?: any[];
  lastSyncTimestamp?: string;
}

// Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Service Types
export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: any;
  type: 'emergency' | 'medicine' | 'task' | 'risk_level' | 'general';
}

export interface RiskAssessmentResult {
  level: 'green' | 'yellow' | 'red';
  factors: string[];
  score: number;
}

// Middleware Types
export interface AuthenticatedRequest extends Express.Request {
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

// Database Types
export interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

export interface DatabaseConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
}
