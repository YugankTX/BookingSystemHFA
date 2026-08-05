import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type {
  User, HafCycle, School, Club, Activity, Parent, Child, Carer,
  ChildClubLink, AttendanceRecord, DeletionRequest, SystemLog, FsmCheck, Role,
} from './types';
import { svcReq } from './api';

// ── Default schools (Bradford area) ──────────────────────────────────────
const DEFAULT_SCHOOLS: School[] = [
  { id: 'ds-1',  name: 'Bowling Park Primary School',      urn: '107507', address: 'Moulson Street, Bradford, BD4 7NU' },
  { id: 'ds-2',  name: 'Laisterdyke Leadership Academy',   urn: '107548', address: 'Dick Lane, Bradford, BD3 8HE' },
  { id: 'ds-3',  name: 'Hanson Academy',                   urn: '107584', address: 'Sutton Avenue, Bradford, BD7 4JT' },
  { id: 'ds-4',  name: 'Thornton Primary School',          urn: '107612', address: 'Thornton Road, Bradford, BD13 3NL' },
  { id: 'ds-5',  name: 'Wibsey Primary School',            urn: '107638', address: 'Station Road, Bradford, BD6 1LD' },
  { id: 'ds-6',  name: 'Beckfoot Upper Heaton',            urn: '107655', address: 'Sticker Lane, Bradford, BD4 8HJ' },
  { id: 'ds-7',  name: 'Carlton Bolling College',          urn: '107660', address: 'Undercliffe Road, Bradford, BD3 0HL' },
  { id: 'ds-8',  name: 'Dixons Kings Academy',             urn: '137073', address: 'Ripley Street, Bradford, BD5 7RR' },
  { id: 'ds-9',  name: 'Bradford Academy',                 urn: '135427', address: 'Burley Road, Bradford, BD3 0RH' },
  { id: 'ds-10', name: 'Rhodesway School',                 urn: '107596', address: 'Rhodesway, Bradford, BD8 0DL' },
];

// ── Backend → frontend type mappers ───────────────────────────────────────

function mapUser(u: any): User {
  return {
    id: u.id ?? '',
    email: u.email ?? '',
    fullName: u.fullName ?? '',
    role: (u.role ?? 'parent') as Role,
    phone: u.phone ?? '',
    isActive: u.isActive ?? true,
    createdAt: String(u.createdAt ?? new Date().toISOString()),
  };
}

function mapCycle(c: any): HafCycle {
  const start = String(c.startDate ?? '');
  const end = String(c.endDate ?? '');
  return {
    id: c.id ?? '',
    name: c.name ?? '',
    startDate: start.split('T')[0],
    endDate: end.split('T')[0],
    status: c.isActive ? 'active' : 'draft',
    createdAt: String(c.createdAt ?? new Date().toISOString()),
  };
}

function mapClub(c: any): Club {
  return {
    id: c.id ?? '',
    userId: c.managedByUserId ?? '',
    name: c.name ?? '',
    description: c.description ?? '',
    contactEmail: c.contactEmail ?? '',
    address: c.address ?? '',
    phone: '',
    isVisible: c.isVisible ?? true,
    logoUrl: '',
    createdAt: String(c.createdAt ?? new Date().toISOString()),
  };
}

function mapActivity(a: any): Activity {
  const start = String(a.startDateTime ?? '');
  const end = String(a.endDateTime ?? '');
  return {
    id: a.id ?? '',
    clubId: a.clubProfileId ?? '',
    cycleId: a.cycleId ?? '',
    title: a.title ?? '',
    description: a.description ?? '',
    startDate: start.split('T')[0],
    endDate: end.split('T')[0],
    startTime: start.includes('T') ? (start.split('T')[1] ?? '').slice(0, 5) : '09:00',
    endTime: end.includes('T') ? (end.split('T')[1] ?? '').slice(0, 5) : '17:00',
    capacity: a.capacity ?? 0,
    location: '',
    ageMin: 0,
    ageMax: 99,
    createdAt: String(a.createdAt ?? new Date().toISOString()),
  };
}

function mapParent(p: any): Parent {
  return {
    id: p.id ?? '',
    userId: p.userId ?? '',
    clubId: null,
    fullName: p.fullName ?? '',
    email: p.email ?? '',
    phone: p.phone ?? '',
    address: '',
    createdAt: String(p.createdAt ?? new Date().toISOString()),
  };
}

function mapChild(c: any): Child {
  const dob = String(c.dateOfBirth ?? '');
  return {
    id: c.id ?? '',
    parentId: c.parentGuardianId ?? '',
    fullName: c.fullName ?? '',
    dateOfBirth: dob.split('T')[0],
    schoolId: null,
    fsmEligible: c.fsmEligible ?? false,
    fsmVerifiedAt: c.fsmVerified ? String(c.updatedAt ?? new Date().toISOString()) : null,
    fsmReference: null,
    createdAt: String(c.createdAt ?? new Date().toISOString()),
  };
}

function mapCarer(cr: any, children: Child[]): Carer {
  const child = children.find(c => c.id === (cr.childId ?? ''));
  return {
    id: cr.id ?? '',
    parentId: child?.parentId ?? '',
    childId: cr.childId ?? null,
    fullName: cr.fullName ?? '',
    relationship: '',
    phone: cr.phone ?? '',
    email: cr.email ?? '',
    createdAt: String(cr.createdAt ?? new Date().toISOString()),
  };
}

function mapBookingToLink(b: any, activities: Activity[]): ChildClubLink {
  const activity = activities.find(a => a.id === (b.activityId ?? ''));
  return {
    id: b.id ?? '',
    childId: b.childId ?? '',
    clubId: activity?.clubId ?? '',
    activityId: b.activityId ?? null,
    status: (b.status === 'Confirmed' || b.status === 'Pending') ? 'active' : 'inactive',
    linkedAt: String(b.bookedAt ?? new Date().toISOString()),
  };
}

function mapAttendanceRecord(a: any): AttendanceRecord {
  const recorded = String(a.recordedAt ?? new Date().toISOString());
  return {
    id: a.id ?? '',
    activityId: a.activityId ?? '',
    childId: a.childId ?? '',
    date: recorded.split('T')[0],
    status: a.attended ? 'present' : 'absent',
    notes: a.notes ?? '',
    recordedAt: recorded,
    recordedBy: '',
  };
}

function mapDrStatus(s: string): 'pending' | 'processed' | 'rejected' {
  if (s === 'Approved') return 'processed';
  if (s === 'Rejected') return 'rejected';
  return 'pending';
}

function mapDeletionRequest(d: any, users: User[]): DeletionRequest {
  const requester = users.find(u => u.id === (d.requestedByUserId ?? ''));
  return {
    id: d.id ?? '',
    parentId: d.requestedByUserId ?? '',
    parentName: requester?.fullName ?? d.requestedByUserId ?? 'Unknown',
    reason: d.reason ?? '',
    status: mapDrStatus(String(d.status ?? 'Pending')),
    requestedAt: String(d.requestedAt ?? new Date().toISOString()),
    processedAt: d.processedAt ?? null,
    processedBy: null,
  };
}

// ── DataStore interface ────────────────────────────────────────────────────
// Kept identical to original so no page component changes are required.

interface DataStore {
  users: User[];
  cycles: HafCycle[];
  schools: School[];
  clubs: Club[];
  activities: Activity[];
  parents: Parent[];
  children: Child[];
  carers: Carer[];
  links: ChildClubLink[];
  attendance: AttendanceRecord[];
  deletionRequests: DeletionRequest[];
  logs: SystemLog[];
  fsmChecks: FsmCheck[];
  currentUser: User | null;
  login: (email: string, password: string) => User | null;
  signup: (email: string, fullName: string, role: Role, phone: string, password: string) => User;
  logout: () => void;
  addLog: (action: string, entityType: string, entityId: string, details: string) => void;
  createUser: (data: Omit<User, 'id' | 'createdAt' | 'isActive'> & { isActive?: boolean }) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  reactivateUser: (id: string) => void;
  createCycle: (data: Omit<HafCycle, 'id' | 'createdAt'>) => void;
  updateCycle: (id: string, data: Partial<HafCycle>) => void;
  deleteCycle: (id: string) => void;
  bulkUploadSchools: (rows: School[]) => void;
  bulkUploadClubs: (rows: Club[]) => void;
  bulkUploadActivities: (rows: Activity[]) => void;
  bulkUploadChildren: (rows: Child[]) => void;
  updateClub: (id: string, data: Partial<Club>) => void;
  toggleClubVisibility: (id: string) => void;
  createActivity: (data: Omit<Activity, 'id' | 'createdAt'>) => void;
  updateActivity: (id: string, data: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  createParent: (data: Omit<Parent, 'id' | 'createdAt'>) => void;
  updateParent: (id: string, data: Partial<Parent>) => void;
  deleteParent: (id: string) => void;
  createChild: (data: Omit<Child, 'id' | 'createdAt'>) => void;
  updateChild: (id: string, data: Partial<Child>) => void;
  deleteChild: (id: string) => void;
  createCarer: (data: Omit<Carer, 'id' | 'createdAt'>) => void;
  updateCarer: (id: string, data: Partial<Carer>) => void;
  deleteCarer: (id: string) => void;
  createLink: (data: Omit<ChildClubLink, 'id' | 'linkedAt'>) => Promise<{ ok: boolean; status: number; data: any }> | undefined;
  updateLink: (id: string, data: Partial<ChildClubLink>) => void;
  deleteLink: (id: string) => void;
  createAttendance: (data: Omit<AttendanceRecord, 'id' | 'recordedAt' | 'recordedBy'>) => void;
  updateAttendance: (id: string, data: Partial<AttendanceRecord>) => void;
  deleteAttendance: (id: string) => void;
  createDeletionRequest: (data: Omit<DeletionRequest, 'id' | 'requestedAt' | 'status' | 'processedAt' | 'processedBy'>) => void;
  processDeletionRequest: (id: string, status: 'processed' | 'rejected') => void;
  runFsmCheck: (childId: string) => void;
}

const StoreContext = createContext<DataStore | null>(null);

let idCounter = 1000;
const genId = () => `id-${++idCounter}`;

// ── Provider ──────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: ReactNode }) {

  // ── State ───────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [cycles, setCycles] = useState<HafCycle[]>([]);
  const [schools, setSchools] = useState<School[]>(() => {
    try {
      const saved = localStorage.getItem('haf_schools');
      const uploaded: School[] = saved ? JSON.parse(saved) : [];
      const uploadedIds = new Set(uploaded.map(s => s.id));
      return [...DEFAULT_SCHOOLS.filter(s => !uploadedIds.has(s.id)), ...uploaded];
    } catch { return DEFAULT_SCHOOLS; }
  });
  const [clubs, setClubs] = useState<Club[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [childrenState, setChildren] = useState<Child[]>([]);
  const [carers, setCarers] = useState<Carer[]>([]);
  const [links, setLinks] = useState<ChildClubLink[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [fsmChecks, setFsmChecks] = useState<FsmCheck[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loggedInEmail, setLoggedInEmail] = useState('');

  // Raw refs used for cross-service lookups without requiring state reads inside callbacks
  const rawBookingsRef = useRef<any[]>([]);
  const rawAttendRef = useRef<Map<string, any>>(new Map());

  // ── Load all data from microservices ────────────────────────────────────

  const loadAll = useCallback(async () => {
    try {
      const [uR, cyR, clR, pR, chR, crR, aR, bR, atR, dR] = await Promise.all([
        svcReq<any[]>('identity', '/api/users').catch(() => ({ ok: false, data: null, status: 0 })),
        svcReq<any[]>('program', '/api/cycles').catch(() => ({ ok: false, data: null, status: 0 })),
        svcReq<any[]>('club', '/api/clubs').catch(() => ({ ok: false, data: null, status: 0 })),
        svcReq<any[]>('family', '/api/parents').catch(() => ({ ok: false, data: null, status: 0 })),
        svcReq<any[]>('family', '/api/children').catch(() => ({ ok: false, data: null, status: 0 })),
        svcReq<any[]>('family', '/api/carers').catch(() => ({ ok: false, data: null, status: 0 })),
        svcReq<any[]>('club', '/api/activities').catch(() => ({ ok: false, data: null, status: 0 })),
        svcReq<any[]>('booking', '/api/bookings').catch(() => ({ ok: false, data: null, status: 0 })),
        svcReq<any[]>('attendance', '/api/attendance').catch(() => ({ ok: false, data: null, status: 0 })),
        svcReq<any[]>('compliance', '/api/deletion-requests').catch(() => ({ ok: false, data: null, status: 0 })),
      ]);

      const mappedUsers = uR.ok && Array.isArray(uR.data) ? uR.data.map(mapUser) : [];
      const mappedCycles = cyR.ok && Array.isArray(cyR.data) ? cyR.data.map(mapCycle) : [];
      const mappedClubs = clR.ok && Array.isArray(clR.data) ? clR.data.map(mapClub) : [];
      const mappedParents = pR.ok && Array.isArray(pR.data) ? pR.data.map(mapParent) : [];
      const mappedChildren = chR.ok && Array.isArray(chR.data) ? chR.data.map(mapChild) : [];
      const mappedCarers = crR.ok && Array.isArray(crR.data) ? crR.data.map((c: any) => mapCarer(c, mappedChildren)) : [];
      const mappedActivities = aR.ok && Array.isArray(aR.data) ? aR.data.map(mapActivity) : [];

      const rawBookings = bR.ok && Array.isArray(bR.data) ? bR.data : [];
      rawBookingsRef.current = rawBookings;
      const mappedLinks = rawBookings.map((b: any) => mapBookingToLink(b, mappedActivities));

      const rawAttMap = new Map<string, any>();
      const mappedAtt = atR.ok && Array.isArray(atR.data)
        ? atR.data.map((a: any) => { rawAttMap.set(a.id, a); return mapAttendanceRecord(a); })
        : [];
      rawAttendRef.current = rawAttMap;

      const mappedDR = dR.ok && Array.isArray(dR.data)
        ? dR.data.map((d: any) => mapDeletionRequest(d, mappedUsers))
        : [];

      setUsers(mappedUsers);
      setCycles(mappedCycles);
      setClubs(mappedClubs);
      setParents(mappedParents);
      setChildren(mappedChildren);
      setCarers(mappedCarers);
      setActivities(mappedActivities);
      setLinks(mappedLinks);
      setAttendance(mappedAtt);
      setDeletionRequests(mappedDR);
    } catch (e) {
      console.error('[store] loadAll failed', e);
    }
  }, []);

  // ── Auth (called by auth.tsx after JWT verification) ────────────────────

  const login = useCallback((email: string, _password: string): User | null => {
    setLoggedInEmail(email);
    loadAll();
    return null; // auth.tsx does not use return value
  }, [loadAll]);

  const signup = useCallback((email: string, fullName: string, role: Role, phone: string, _password: string): User => {
    loadAll();
    return { id: '', email, fullName, role, phone, isActive: true, createdAt: new Date().toISOString() };
  }, [loadAll]);

  const logout = useCallback(() => {
    setLoggedInEmail('');
    setCurrentUser(null);
    setUsers([]); setCycles([]); setClubs([]); setActivities([]);
    setParents([]); setChildren([]); setCarers([]);
    setLinks([]); setAttendance([]); setDeletionRequests([]);
    setFsmChecks([]);
    rawBookingsRef.current = [];
    rawAttendRef.current = new Map();
  }, []);

  // Derive currentUser from users list once data loads; auto-create ParentGuardian if missing
  useEffect(() => {
    if (!loggedInEmail) return;
    const u = users.find(u => u.email.toLowerCase() === loggedInEmail.toLowerCase());
    if (!u) return;
    setCurrentUser(u);
    if (u.role === 'parent') {
      const hasRecord = parents.some(p => p.userId === u.id);
      if (!hasRecord) {
        svcReq('family', '/api/parents', {
          method: 'POST',
          body: JSON.stringify({ fullName: u.fullName, email: u.email, phone: u.phone }),
        }).then(r => { if (r.ok) loadAll(); });
      }
    }
  }, [users, parents, loggedInEmail, loadAll]);

  // ── Logs (frontend-only audit trail) ────────────────────────────────────

  const addLog = useCallback((action: string, entityType: string, entityId: string, details: string) => {
    setLogs(prev => [{
      id: genId(),
      userId: currentUser?.id ?? '',
      userName: currentUser?.fullName ?? 'System',
      action, entityType, entityId, details,
      createdAt: new Date().toISOString(),
    }, ...prev]);
  }, [currentUser]);

  // ── Users (identity-service) ─────────────────────────────────────────────

  const createUser: DataStore['createUser'] = useCallback((data) => {
    svcReq('identity', '/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: data.email, fullName: data.fullName, role: data.role, phone: data.phone, password: 'demo123' }),
    }).then(r => { if (r.ok) { loadAll(); addLog('CREATE_USER', 'user', '', `Created ${data.role}: ${data.fullName}`); } });
  }, [loadAll, addLog]);

  const updateUser: DataStore['updateUser'] = useCallback((id, data) => {
    svcReq('identity', `/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ fullName: data.fullName, email: data.email, role: data.role, phone: data.phone, isActive: data.isActive }),
    }).then(r => { if (r.ok) { loadAll(); addLog('UPDATE_USER', 'user', id, `Updated user: ${data.fullName ?? id}`); } });
  }, [loadAll, addLog]);

  const deleteUser: DataStore['deleteUser'] = useCallback((id) => {
    svcReq('identity', `/api/users/${id}`, { method: 'DELETE' })
      .then(r => { if (r.ok) { loadAll(); addLog('DELETE_USER', 'user', id, `Deactivated user: ${id}`); } });
  }, [loadAll, addLog]);

  const reactivateUser: DataStore['reactivateUser'] = useCallback((id) => {
    svcReq('identity', `/api/users/${id}/reactivate`, { method: 'POST' })
      .then(r => { if (r.ok) { loadAll(); addLog('REACTIVATE_USER', 'user', id, `Reactivated user: ${id}`); } });
  }, [loadAll, addLog]);

  // ── Cycles (program-service) ─────────────────────────────────────────────

  const createCycle: DataStore['createCycle'] = useCallback((data) => {
    svcReq('program', '/api/cycles', {
      method: 'POST',
      body: JSON.stringify({ name: data.name, startDate: data.startDate, endDate: data.endDate, isActive: data.status === 'active' }),
    }).then(r => { if (r.ok) { loadAll(); addLog('CREATE_CYCLE', 'haf_cycle', '', `Created cycle: ${data.name}`); } });
  }, [loadAll, addLog]);

  const updateCycle: DataStore['updateCycle'] = useCallback((id, data) => {
    const existing = cycles.find(c => c.id === id);
    if (!existing) return;
    svcReq('program', `/api/cycles/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name ?? existing.name,
        startDate: data.startDate ?? existing.startDate,
        endDate: data.endDate ?? existing.endDate,
        isActive: (data.status ?? existing.status) === 'active',
      }),
    }).then(r => { if (r.ok) { loadAll(); addLog('UPDATE_CYCLE', 'haf_cycle', id, `Updated cycle: ${data.name ?? id}`); } });
  }, [cycles, loadAll, addLog]);

  const deleteCycle: DataStore['deleteCycle'] = useCallback((id) => {
    svcReq('program', `/api/cycles/${id}`, { method: 'DELETE' })
      .then(r => { if (r.ok) { loadAll(); addLog('DELETE_CYCLE', 'haf_cycle', id, `Deleted cycle: ${id}`); } });
  }, [loadAll, addLog]);

  // ── Bulk uploads (frontend-only; no batch API on backend) ───────────────

  const bulkUploadSchools: DataStore['bulkUploadSchools'] = useCallback((rows) => {
    setSchools(prev => {
      const updated = [...prev, ...rows];
      try { localStorage.setItem('haf_schools', JSON.stringify(updated)); } catch {}
      return updated;
    });
    addLog('BULK_UPLOAD', 'schools', '', `Uploaded ${rows.length} schools`);
  }, [addLog]);

  const bulkUploadClubs: DataStore['bulkUploadClubs'] = useCallback((rows) => {
    setClubs(prev => [...prev, ...rows]);
    addLog('BULK_UPLOAD', 'clubs', '', `Uploaded ${rows.length} clubs`);
  }, [addLog]);

  const bulkUploadActivities: DataStore['bulkUploadActivities'] = useCallback((rows) => {
    setActivities(prev => [...prev, ...rows]);
    addLog('BULK_UPLOAD', 'activities', '', `Uploaded ${rows.length} activities`);
  }, [addLog]);

  const bulkUploadChildren: DataStore['bulkUploadChildren'] = useCallback((rows) => {
    setChildren(prev => [...prev, ...rows]);
    addLog('BULK_UPLOAD', 'children', '', `Uploaded ${rows.length} children (FSM dataset)`);
  }, [addLog]);

  // ── Clubs (club-activity-service) ────────────────────────────────────────

  const updateClub: DataStore['updateClub'] = useCallback((id, data) => {
    const existing = clubs.find(c => c.id === id);
    if (!existing) return;
    svcReq('club', `/api/clubs/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name ?? existing.name,
        description: data.description ?? existing.description,
        contactEmail: data.contactEmail ?? existing.contactEmail,
        address: data.address ?? existing.address,
        isVisible: data.isVisible ?? existing.isVisible,
        managedByUserId: existing.userId,
      }),
    }).then(r => { if (r.ok) { loadAll(); addLog('UPDATE_CLUB', 'club', id, `Updated club: ${data.name ?? id}`); } });
  }, [clubs, loadAll, addLog]);

  const toggleClubVisibility: DataStore['toggleClubVisibility'] = useCallback((id) => {
    svcReq('club', `/api/clubs/${id}/visibility`, { method: 'PATCH' })
      .then(r => {
        if (r.ok) {
          const club = clubs.find(c => c.id === id);
          loadAll();
          addLog('TOGGLE_CLUB_VISIBILITY', 'club', id, `Toggled ${club?.name ?? id} visibility`);
        }
      });
  }, [clubs, loadAll, addLog]);

  // ── Activities (club-activity-service) ───────────────────────────────────

  const createActivity: DataStore['createActivity'] = useCallback((data) => {
    const start = data.startDate && data.startTime ? `${data.startDate}T${data.startTime}:00Z` : data.startDate;
    const end = data.endDate && data.endTime ? `${data.endDate}T${data.endTime}:00Z` : data.endDate;
    svcReq('club', '/api/activities', {
      method: 'POST',
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        clubProfileId: data.clubId,
        cycleId: data.cycleId,
        startDateTime: start,
        endDateTime: end,
        capacity: data.capacity,
        isActive: true,
      }),
    }).then(r => { if (r.ok) { loadAll(); addLog('CREATE_ACTIVITY', 'activity', '', `Created activity: ${data.title}`); } });
  }, [loadAll, addLog]);

  const updateActivity: DataStore['updateActivity'] = useCallback((id, data) => {
    const ex = activities.find(a => a.id === id);
    if (!ex) return;
    const sd = data.startDate ?? ex.startDate;
    const st = data.startTime ?? ex.startTime;
    const ed = data.endDate ?? ex.endDate;
    const et = data.endTime ?? ex.endTime;
    svcReq('club', `/api/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: data.title ?? ex.title,
        description: data.description ?? ex.description,
        clubProfileId: data.clubId ?? ex.clubId,
        cycleId: data.cycleId ?? ex.cycleId,
        startDateTime: sd && st ? `${sd}T${st}:00Z` : sd,
        endDateTime: ed && et ? `${ed}T${et}:00Z` : ed,
        capacity: data.capacity ?? ex.capacity,
        isActive: true,
      }),
    }).then(r => { if (r.ok) { loadAll(); addLog('UPDATE_ACTIVITY', 'activity', id, `Updated activity: ${data.title ?? id}`); } });
  }, [activities, loadAll, addLog]);

  const deleteActivity: DataStore['deleteActivity'] = useCallback((id) => {
    svcReq('club', `/api/activities/${id}`, { method: 'DELETE' })
      .then(r => { if (r.ok) { loadAll(); addLog('DELETE_ACTIVITY', 'activity', id, `Deleted activity: ${id}`); } });
  }, [loadAll, addLog]);

  // ── Parents (family-service) ─────────────────────────────────────────────

  const createParent: DataStore['createParent'] = useCallback((data) => {
    svcReq('family', '/api/parents', {
      method: 'POST',
      body: JSON.stringify({ fullName: data.fullName, email: data.email, phone: data.phone }),
    }).then(r => { if (r.ok) { loadAll(); addLog('CREATE_PARENT', 'parent', '', `Created parent: ${data.fullName}`); } });
  }, [loadAll, addLog]);

  const updateParent: DataStore['updateParent'] = useCallback((id, data) => {
    const ex = parents.find(p => p.id === id);
    if (!ex) return;
    svcReq('family', `/api/parents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ fullName: data.fullName ?? ex.fullName, email: data.email ?? ex.email, phone: data.phone ?? ex.phone }),
    }).then(r => { if (r.ok) { loadAll(); addLog('UPDATE_PARENT', 'parent', id, `Updated parent: ${data.fullName ?? id}`); } });
  }, [parents, loadAll, addLog]);

  const deleteParent: DataStore['deleteParent'] = useCallback((id) => {
    svcReq('family', `/api/parents/${id}`, { method: 'DELETE' })
      .then(r => { if (r.ok) { loadAll(); addLog('DELETE_PARENT', 'parent', id, `Deleted parent: ${id}`); } });
  }, [loadAll, addLog]);

  // ── Children (family-service) ────────────────────────────────────────────

  const createChild: DataStore['createChild'] = useCallback((data) => {
    if (!data.parentId) return;
    svcReq('family', '/api/children', {
      method: 'POST',
      body: JSON.stringify({
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth || '2000-01-01T00:00:00Z',
        fsmEligible: data.fsmEligible,
        parentGuardianId: data.parentId,
      }),
    }).then(r => { if (r.ok) { loadAll(); addLog('CREATE_CHILD', 'child', '', `Created child: ${data.fullName}`); } });
  }, [loadAll, addLog]);

  const updateChild: DataStore['updateChild'] = useCallback((id, data) => {
    const ex = childrenState.find(c => c.id === id);
    if (!ex) return;
    svcReq('family', `/api/children/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        fullName: data.fullName ?? ex.fullName,
        dateOfBirth: (data.dateOfBirth ?? ex.dateOfBirth) || '2000-01-01T00:00:00Z',
        fsmEligible: data.fsmEligible ?? ex.fsmEligible,
        parentGuardianId: ex.parentId,
      }),
    }).then(r => { if (r.ok) { loadAll(); addLog('UPDATE_CHILD', 'child', id, `Updated child: ${data.fullName ?? id}`); } });
  }, [childrenState, loadAll, addLog]);

  const deleteChild: DataStore['deleteChild'] = useCallback((id) => {
    svcReq('family', `/api/children/${id}`, { method: 'DELETE' })
      .then(r => { if (r.ok) { loadAll(); addLog('DELETE_CHILD', 'child', id, `Deleted child: ${id}`); } });
  }, [loadAll, addLog]);

  // ── Carers (family-service) ──────────────────────────────────────────────

  const createCarer: DataStore['createCarer'] = useCallback((data) => {
    if (!data.childId) return; // backend requires childId
    svcReq('family', '/api/carers', {
      method: 'POST',
      body: JSON.stringify({ fullName: data.fullName, email: data.email, phone: data.phone, childId: data.childId }),
    }).then(r => { if (r.ok) { loadAll(); addLog('CREATE_CARER', 'carer', '', `Created carer: ${data.fullName}`); } });
  }, [loadAll, addLog]);

  const updateCarer: DataStore['updateCarer'] = useCallback((id, data) => {
    const ex = carers.find(c => c.id === id);
    if (!ex) return;
    svcReq('family', `/api/carers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        fullName: data.fullName ?? ex.fullName,
        email: data.email ?? ex.email,
        phone: data.phone ?? ex.phone,
        childId: data.childId ?? ex.childId,
      }),
    }).then(r => { if (r.ok) { loadAll(); addLog('UPDATE_CARER', 'carer', id, `Updated carer: ${data.fullName ?? id}`); } });
  }, [carers, loadAll, addLog]);

  const deleteCarer: DataStore['deleteCarer'] = useCallback((id) => {
    svcReq('family', `/api/carers/${id}`, { method: 'DELETE' })
      .then(r => { if (r.ok) { loadAll(); addLog('DELETE_CARER', 'carer', id, `Deleted carer: ${id}`); } });
  }, [loadAll, addLog]);

  // ── Links → Bookings (booking-service) ──────────────────────────────────

  const createLink: DataStore['createLink'] = useCallback(async (data) => {
    if (!data.activityId || !data.childId) return { ok: false, status: 400, data: null };

    // Step 1: acquire a seat lock
    const lockRes = await svcReq('booking', '/api/bookings/lock', {
      method: 'POST',
      body: JSON.stringify({ childId: data.childId, activityId: data.activityId }),
    });
    if (!lockRes.ok) return lockRes;

    const lockToken: string = (lockRes.data as any)?.lockToken;

    // Step 2: create the booking using the lock token
    const r = await svcReq('booking', '/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ childId: data.childId, activityId: data.activityId, lockToken }),
    });
    if (r.ok) { loadAll(); addLog('CREATE_LINK', 'child_club_link', '', 'Linked child to activity'); }
    return r;
  }, [loadAll, addLog]);

  const updateLink: DataStore['updateLink'] = useCallback((id, data) => {
    if (!data.status) return;
    const apiStatus = data.status === 'active' ? 'Confirmed' : 'Cancelled';
    svcReq('booking', `/api/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: apiStatus }),
    }).then(r => { if (r.ok) loadAll(); });
  }, [loadAll]);

  const deleteLink: DataStore['deleteLink'] = useCallback((id) => {
    svcReq('booking', `/api/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Cancelled' }),
    }).then(r => { if (r.ok) { loadAll(); addLog('DELETE_LINK', 'child_club_link', id, 'Unlinked child from activity'); } });
  }, [loadAll, addLog]);

  // ── Attendance (attendance-service) ──────────────────────────────────────

  const createAttendance: DataStore['createAttendance'] = useCallback((data) => {
    // Find the booking that links this child to this activity
    const booking = rawBookingsRef.current.find(
      (b: any) => b.childId === data.childId && b.activityId === data.activityId,
    );
    if (!booking) return;

    const attended = data.status === 'present' || data.status === 'late';

    svcReq('attendance', '/api/attendance', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        childId: data.childId,
        activityId: data.activityId,
        attended,
        notes: data.notes,
      }),
    }).then(r => {
      if (r.ok) {
        loadAll();
        return;
      }
      // 409 means pre-created by event consumer — find and update instead
      if (r.status === 409) {
        const existing = [...rawAttendRef.current.values()]
          .find((a: any) => a.bookingId === booking.id);
        if (existing) {
          svcReq('attendance', `/api/attendance/${existing.id}`, {
            method: 'PUT',
            body: JSON.stringify({ bookingId: booking.id, attended, notes: data.notes }),
          }).then(() => loadAll());
        }
      }
    });
  }, [loadAll]);

  const updateAttendance: DataStore['updateAttendance'] = useCallback((id, data) => {
    const raw = rawAttendRef.current.get(id);
    if (!raw) return;
    const attended = data.status != null
      ? (data.status === 'present' || data.status === 'late')
      : raw.attended;
    svcReq('attendance', `/api/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ bookingId: raw.bookingId, attended, notes: data.notes ?? raw.notes }),
    }).then(r => { if (r.ok) loadAll(); });
  }, [loadAll]);

  const deleteAttendance: DataStore['deleteAttendance'] = useCallback((id) => {
    // No DELETE endpoint — remove from local state only
    setAttendance(prev => prev.filter(a => a.id !== id));
    rawAttendRef.current.delete(id);
  }, []);

  // ── Deletion Requests (compliance-service) ────────────────────────────────

  const createDeletionRequest: DataStore['createDeletionRequest'] = useCallback((data) => {
    svcReq('compliance', '/api/deletion-requests', {
      method: 'POST',
      body: JSON.stringify({ subjectType: 'Parent', subjectId: data.parentId, reason: data.reason }),
    }).then(r => {
      if (r.ok) {
        // Optimistic local add so the parent sees it immediately
        setDeletionRequests(prev => [{
          id: genId(),
          parentId: data.parentId,
          parentName: data.parentName,
          reason: data.reason,
          status: 'pending',
          requestedAt: new Date().toISOString(),
          processedAt: null,
          processedBy: null,
        }, ...prev]);
        addLog('CREATE_DELETION_REQUEST', 'deletion_request', '', `Deletion request from ${data.parentName}`);
      }
    });
  }, [addLog]);

  const processDeletionRequest: DataStore['processDeletionRequest'] = useCallback((id, status) => {
    const apiStatus = status === 'processed' ? 'approved' : 'rejected';
    svcReq('compliance', `/api/deletion-requests/${id}/process`, {
      method: 'POST',
      body: JSON.stringify({ status: apiStatus }),
    }).then(r => {
      if (r.ok) {
        loadAll();
        addLog('PROCESS_DELETION_REQUEST', 'deletion_request', id, `Marked as ${status}`);
      }
    });
  }, [loadAll, addLog]);

  // ── FSM (eligibility-service + local checks list) ─────────────────────────

  const runFsmCheck: DataStore['runFsmCheck'] = useCallback((childId) => {
    const child = childrenState.find(c => c.id === childId);
    if (!child || !currentUser) return;

    svcReq('eligibility', `/api/fsm/${childId}/check`, { method: 'POST' }).then(r => {
      if (r.ok) {
        loadAll();
        setFsmChecks(prev => [{
          id: genId(),
          childId,
          childName: child.fullName,
          checkerId: currentUser.id,
          checkerName: currentUser.fullName,
          result: 'eligible',
          checkedAt: new Date().toISOString(),
        }, ...prev]);
        addLog('FSM_CHECK', 'child', childId, `FSM check for ${child.fullName}: eligible`);
      }
    });
  }, [childrenState, currentUser, loadAll, addLog]);

  // ── Compose store ─────────────────────────────────────────────────────────

  const store: DataStore = {
    users, cycles, schools, clubs, activities,
    parents, children: childrenState, carers,
    links, attendance, deletionRequests, logs, fsmChecks, currentUser,
    login, signup, logout, addLog,
    createUser, updateUser, deleteUser, reactivateUser,
    createCycle, updateCycle, deleteCycle,
    bulkUploadSchools, bulkUploadClubs, bulkUploadActivities, bulkUploadChildren,
    updateClub, toggleClubVisibility,
    createActivity, updateActivity, deleteActivity,
    createParent, updateParent, deleteParent,
    createChild, updateChild, deleteChild,
    createCarer, updateCarer, deleteCarer,
    createLink, updateLink, deleteLink,
    createAttendance, updateAttendance, deleteAttendance,
    createDeletionRequest, processDeletionRequest,
    runFsmCheck,
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  debugger;
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
