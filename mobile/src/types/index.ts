// User Types
export type UserRole = 'elder' | 'guardian';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile: ElderProfile | GuardianProfile;
  createdAt: Date;
  updatedAt: Date;
}

// Elder Types
export interface ElderProfile {
  name: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  language: 'si' | 'ta' | 'en';
  emergencyContacts: EmergencyContact[];
  guardianIds: string[];
  riskLevel: RiskLevel;
  lastActive: Date;
  photoUrl?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

// Guardian Types
export interface GuardianProfile {
  name: string;
  phone: string;
  address: string;
  language: 'si' | 'ta' | 'en';
  elderIds: string[];
  photoUrl?: string;
}

// Risk Level Types
export type RiskLevel = 'green' | 'yellow' | 'red';

export interface RiskAssessment {
  level: RiskLevel;
  factors: string[];
  timestamp: Date;
}

// Medicine Types
export interface Medicine {
  id: string;
  elderId: string;
  name: string;
  dosage: string;
  frequency: 'daily' | 'weekly' | 'as-needed';
  times: string[]; // ["08:00", "20:00"]
  startDate: Date;
  endDate?: Date;
  notes?: string;
  nextDoseTime: Date;
  adherence: number; // 0-100
  synced: boolean;
}

export interface MedicineDose {
  id: string;
  medicineId: string;
  scheduledTime: Date;
  takenTime?: Date;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  notes?: string;
}

// Task Types
export interface Task {
  id: string;
  elderId: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate: Date;
  completedAt?: Date;
  priority: 'low' | 'medium' | 'high';
  synced: boolean;
}

// Mood Types
export type MoodType = 'happy' | 'sad' | 'neutral' | 'anxious' | 'pain';

export interface Mood {
  id: string;
  elderId: string;
  mood: MoodType;
  notes?: string;
  timestamp: Date;
  synced: boolean;
}

// Emergency Types
export type EmergencyType = 'sos' | 'fall' | 'keyword' | 'inactivity';
export type EmergencyStatus = 'active' | 'acknowledged' | 'resolved';

export interface Emergency {
  id: string;
  elderId: string;
  type: EmergencyType;
  status: EmergencyStatus;
  location?: Location;
  audioUrl?: string;
  audioPath?: string;
  detectionConfidence?: number;
  notes?: string;
  timestamp: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  notifiedGuardians: string[];
  synced: boolean;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

// Notification Types
export type NotificationType = 'emergency' | 'medicine' | 'task' | 'risk_level' | 'general';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  timestamp: Date;
}

// Relationship Types
export interface Relationship {
  id: string;
  guardianId: string;
  elderId: string;
  relationship: string; // "son", "daughter", "caregiver", etc.
  status: 'pending' | 'active' | 'inactive';
  createdAt: Date;
}

// Sync Types
export interface SyncQueueItem {
  id: number;
  entityType: 'medicine' | 'task' | 'mood' | 'emergency';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  createdAt: Date;
  retryCount: number;
}

export interface SyncStatus {
  lastSyncTime?: Date;
  pendingItems: number;
  isSyncing: boolean;
  error?: string;
}

// AI Detection Types
export interface AudioFeatures {
  mfcc: number[][];
  duration: number;
  sampleRate: number;
}

export interface DetectionResult {
  isEmergency: boolean;
  confidence: number;
  detectedKeyword?: string;
  timestamp: Date;
}

// Dashboard Types (Guardian)
export interface ElderStatus {
  elder: ElderProfile;
  riskLevel: RiskLevel;
  riskFactors: string[];
  lastActive: Date;
  medicineAdherence: number;
  todayTasks: {
    completed: number;
    total: number;
  };
  recentMoods: Mood[];
  location?: Location;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Navigation Types (will be extended in navigation/types.ts)
export type RootStackParamList = {
  Auth: undefined;
  ElderHome: undefined;
  GuardianHome: undefined;
};

export type ElderStackParamList = {
  Home: undefined;
  Emergency: undefined;
  Medicines: undefined;
  Tasks: undefined;
  Mood: undefined;
  Profile: undefined;
};

export type GuardianStackParamList = {
  Dashboard: undefined;
  ElderDetails: { elderId: string };
  Alerts: undefined;
  Profile: undefined;
};
