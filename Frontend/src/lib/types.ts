export type Role = 'admin' | 'council' | 'club' | 'parent';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

export interface HafCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'closed';
  createdAt: string;
}

export interface School {
  id: string;
  name: string;
  urn: string;
  address: string;
}

export interface Club {
  id: string;
  userId: string;
  name: string;
  description: string;
  contactEmail: string;
  address: string;
  phone: string;
  isVisible: boolean;
  logoUrl: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  clubId: string;
  cycleId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  location: string;
  ageMin: number;
  ageMax: number;
  createdAt: string;
}

export interface Parent {
  id: string;
  userId: string;
  clubId: string | null;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Child {
  id: string;
  parentId: string;
  fullName: string;
  dateOfBirth: string;
  schoolId: string | null;
  fsmEligible: boolean;
  fsmVerifiedAt: string | null;
  fsmReference: string | null;
  createdAt: string;
}

export interface Carer {
  id: string;
  parentId: string;
  childId: string | null;
  fullName: string;
  relationship: string;
  phone: string;
  email: string;
  createdAt: string;
}

export interface ChildClubLink {
  id: string;
  childId: string;
  clubId: string;
  activityId: string | null;
  status: 'active' | 'inactive';
  linkedAt: string;
}

export interface AttendanceRecord {
  id: string;
  activityId: string;
  childId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes: string;
  recordedAt: string;
  recordedBy: string;
}

export interface DeletionRequest {
  id: string;
  parentId: string;
  parentName: string;
  reason: string;
  status: 'pending' | 'processed' | 'rejected';
  requestedAt: string;
  processedAt: string | null;
  processedBy: string | null;
}

export interface SystemLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface FsmCheck {
  id: string;
  childId: string;
  childName: string;
  checkerId: string;
  checkerName: string;
  result: 'eligible' | 'not_eligible';
  checkedAt: string;
}

export interface OtpRecord {
  email: string;
  code: string;
  expiresAt: number;
  purpose: 'signup' | 'login';
}
