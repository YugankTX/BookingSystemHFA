import type {
  User, HafCycle, School, Club, Activity, Parent, Child, Carer,
  ChildClubLink, AttendanceRecord, DeletionRequest, SystemLog, FsmCheck,
} from './types';

export const seedUsers: User[] = [
  { id: 'u1', email: 'admin@haf.gov.uk', fullName: 'System Administrator', role: 'admin', phone: '020 7000 0001', isActive: true, createdAt: '2025-01-01T09:00:00Z' },
  { id: 'u2', email: 'council@haf.gov.uk', fullName: 'Council Manager', role: 'council', phone: '020 7000 0002', isActive: true, createdAt: '2025-01-02T09:00:00Z' },
  { id: 'u3', email: 'club@haf.gov.uk', fullName: 'Club Operator', role: 'club', phone: '020 7000 0003', isActive: true, createdAt: '2025-01-03T09:00:00Z' },
  { id: 'u4', email: 'parent@haf.gov.uk', fullName: 'Parent Guardian', role: 'parent', phone: '020 7000 0004', isActive: true, createdAt: '2025-01-04T09:00:00Z' },
  { id: 'u5', email: 'admin2@haf.gov.uk', fullName: 'Deputy Admin', role: 'admin', phone: '020 7000 0005', isActive: true, createdAt: '2025-01-05T09:00:00Z' },
  { id: 'u6', email: 'council2@haf.gov.uk', fullName: 'Council Officer', role: 'council', phone: '020 7000 0006', isActive: false, createdAt: '2025-01-06T09:00:00Z' },
];

export const seedCycles: HafCycle[] = [
  { id: 'c1', name: 'Easter 2025', startDate: '2025-04-07', endDate: '2025-04-18', status: 'active', createdAt: '2025-01-10T09:00:00Z' },
  { id: 'c2', name: 'Summer 2025', startDate: '2025-07-21', endDate: '2025-08-22', status: 'active', createdAt: '2025-01-10T09:00:00Z' },
  { id: 'c3', name: 'Winter 2025', startDate: '2025-12-22', endDate: '2026-01-02', status: 'draft', createdAt: '2025-01-10T09:00:00Z' },
];

export const seedSchools: School[] = [
  { id: 's1', name: 'Riverside Primary School', urn: '100001', address: '1 River Lane, London' },
  { id: 's2', name: 'Greenfield Academy', urn: '100002', address: '45 Oak Street, London' },
  { id: 's3', name: 'St Marys CE School', urn: '100003', address: '12 Church Road, London' },
  { id: 's4', name: 'Kingsmead Junior School', urn: '100004', address: '7 Kings Way, London' },
];

export const seedClubs: Club[] = [
  { id: 'cl1', userId: 'u3', name: 'Active Sports Club', description: 'Sports and physical activities for children aged 5-16', contactEmail: 'info@activesports.co.uk', address: '100 Sports Road, London', phone: '020 7000 0100', isVisible: true, logoUrl: '', createdAt: '2025-01-15T09:00:00Z' },
  { id: 'cl2', userId: 'u3', name: 'Creative Arts Hub', description: 'Arts, crafts, and drama workshops', contactEmail: 'hello@creativearts.co.uk', address: '22 Art Lane, London', phone: '020 7000 0101', isVisible: true, logoUrl: '', createdAt: '2025-01-16T09:00:00Z' },
  { id: 'cl3', userId: 'u3', name: 'Adventure Outdoors', description: 'Outdoor adventure and nature activities', contactEmail: 'info@adventureout.co.uk', address: '5 Forest Drive, London', phone: '020 7000 0102', isVisible: false, logoUrl: '', createdAt: '2025-01-17T09:00:00Z' },
];

export const seedActivities: Activity[] = [
  { id: 'a1', clubId: 'cl1', cycleId: 'c1', title: 'Multi-Sports Camp', description: 'Football, tennis, basketball and more', startDate: '2025-04-07', endDate: '2025-04-11', startTime: '09:00', endTime: '15:00', capacity: 30, location: 'Sports Hall A', ageMin: 6, ageMax: 12, createdAt: '2025-02-01T09:00:00Z' },
  { id: 'a2', clubId: 'cl1', cycleId: 'c1', title: 'Swimming Lessons', description: 'Beginner and intermediate swimming', startDate: '2025-04-14', endDate: '2025-04-18', startTime: '10:00', endTime: '12:00', capacity: 15, location: 'Pool Complex', ageMin: 7, ageMax: 14, createdAt: '2025-02-02T09:00:00Z' },
  { id: 'a3', clubId: 'cl2', cycleId: 'c1', title: 'Drama Workshop', description: 'Acting, singing, and performance skills', startDate: '2025-04-07', endDate: '2025-04-10', startTime: '10:00', endTime: '14:00', capacity: 20, location: 'Studio 1', ageMin: 8, ageMax: 16, createdAt: '2025-02-03T09:00:00Z' },
  { id: 'a4', clubId: 'cl2', cycleId: 'c2', title: 'Summer Arts Festival', description: 'Painting, sculpture, and crafts', startDate: '2025-07-21', endDate: '2025-07-25', startTime: '09:00', endTime: '15:00', capacity: 25, location: 'Arts Centre', ageMin: 5, ageMax: 15, createdAt: '2025-02-04T09:00:00Z' },
  { id: 'a5', clubId: 'cl1', cycleId: 'c2', title: 'Summer Football Academy', description: 'Intensive football training and matches', startDate: '2025-07-28', endDate: '2025-08-01', startTime: '09:00', endTime: '15:00', capacity: 40, location: 'Main Pitch', ageMin: 8, ageMax: 16, createdAt: '2025-02-05T09:00:00Z' },
];

export const seedParents: Parent[] = [
  { id: 'p1', userId: 'u4', clubId: null, fullName: 'Parent Guardian', email: 'parent@haf.gov.uk', phone: '020 7000 0004', address: '10 Home Street, London', createdAt: '2025-01-20T09:00:00Z' },
  { id: 'p2', userId: 'u4', clubId: 'cl1', fullName: 'Jane Smith', email: 'jane@example.com', phone: '020 7000 0200', address: '5 Park Avenue, London', createdAt: '2025-01-21T09:00:00Z' },
  { id: 'p3', userId: 'u4', clubId: 'cl2', fullName: 'Mark Johnson', email: 'mark@example.com', phone: '020 7000 0201', address: '33 Hill Road, London', createdAt: '2025-01-22T09:00:00Z' },
];

export const seedChildren: Child[] = [
  { id: 'ch1', parentId: 'p1', fullName: 'Alex Guardian', dateOfBirth: '2015-03-15', schoolId: 's1', fsmEligible: true, fsmVerifiedAt: '2025-01-25T10:00:00Z', fsmReference: 'FSM-001234', createdAt: '2025-01-20T09:00:00Z' },
  { id: 'ch2', parentId: 'p1', fullName: 'Sam Guardian', dateOfBirth: '2017-07-22', schoolId: 's1', fsmEligible: false, fsmVerifiedAt: null, fsmReference: null, createdAt: '2025-01-20T09:00:00Z' },
  { id: 'ch3', parentId: 'p2', fullName: 'Emily Smith', dateOfBirth: '2014-11-05', schoolId: 's2', fsmEligible: true, fsmVerifiedAt: '2025-01-26T10:00:00Z', fsmReference: 'FSM-001235', createdAt: '2025-01-21T09:00:00Z' },
  { id: 'ch4', parentId: 'p3', fullName: 'Tom Johnson', dateOfBirth: '2016-01-10', schoolId: 's3', fsmEligible: false, fsmVerifiedAt: null, fsmReference: null, createdAt: '2025-01-22T09:00:00Z' },
];

export const seedCarers: Carer[] = [
  { id: 'cr1', parentId: 'p1', childId: 'ch1', fullName: 'Grandma Guardian', relationship: 'Grandparent', phone: '020 7000 0300', email: 'grandma@example.com', createdAt: '2025-01-20T09:00:00Z' },
  { id: 'cr2', parentId: 'p1', childId: null, fullName: 'Uncle Bob', relationship: 'Uncle', phone: '020 7000 0301', email: 'bob@example.com', createdAt: '2025-01-20T09:00:00Z' },
  { id: 'cr3', parentId: 'p2', childId: 'ch3', fullName: 'David Smith', relationship: 'Father', phone: '020 7000 0302', email: 'david@example.com', createdAt: '2025-01-21T09:00:00Z' },
];

export const seedLinks: ChildClubLink[] = [
  { id: 'l1', childId: 'ch1', clubId: 'cl1', activityId: 'a1', status: 'active', linkedAt: '2025-03-01T09:00:00Z' },
  { id: 'l2', childId: 'ch1', clubId: 'cl2', activityId: 'a3', status: 'active', linkedAt: '2025-03-02T09:00:00Z' },
  { id: 'l3', childId: 'ch2', clubId: 'cl1', activityId: 'a2', status: 'active', linkedAt: '2025-03-03T09:00:00Z' },
  { id: 'l4', childId: 'ch3', clubId: 'cl1', activityId: 'a1', status: 'active', linkedAt: '2025-03-04T09:00:00Z' },
  { id: 'l5', childId: 'ch4', clubId: 'cl2', activityId: 'a4', status: 'active', linkedAt: '2025-03-05T09:00:00Z' },
];

export const seedAttendance: AttendanceRecord[] = [
  { id: 'att1', activityId: 'a1', childId: 'ch1', date: '2025-04-07', status: 'present', notes: '', recordedAt: '2025-04-07T09:30:00Z', recordedBy: 'u3' },
  { id: 'att2', activityId: 'a1', childId: 'ch3', date: '2025-04-07', status: 'present', notes: '', recordedAt: '2025-04-07T09:30:00Z', recordedBy: 'u3' },
  { id: 'att3', activityId: 'a1', childId: 'ch1', date: '2025-04-08', status: 'late', notes: 'Arrived 30 min late', recordedAt: '2025-04-08T09:30:00Z', recordedBy: 'u3' },
  { id: 'att4', activityId: 'a1', childId: 'ch3', date: '2025-04-08', status: 'absent', notes: 'Sick', recordedAt: '2025-04-08T09:30:00Z', recordedBy: 'u3' },
  { id: 'att5', activityId: 'a3', childId: 'ch1', date: '2025-04-07', status: 'present', notes: '', recordedAt: '2025-04-07T10:30:00Z', recordedBy: 'u3' },
  { id: 'att6', activityId: 'a2', childId: 'ch2', date: '2025-04-14', status: 'present', notes: '', recordedAt: '2025-04-14T10:30:00Z', recordedBy: 'u3' },
];

export const seedDeletionRequests: DeletionRequest[] = [
  { id: 'd1', parentId: 'u4', parentName: 'Parent Guardian', reason: 'No longer need HAF services', status: 'pending', requestedAt: '2025-06-01T09:00:00Z', processedAt: null, processedBy: null },
  { id: 'd2', parentId: 'u4', parentName: 'Jane Smith', reason: 'Moving to different city', status: 'processed', requestedAt: '2025-05-15T09:00:00Z', processedAt: '2025-05-20T14:00:00Z', processedBy: 'u1' },
];

export const seedLogs: SystemLog[] = [
  { id: 'log1', userId: 'u1', userName: 'System Administrator', action: 'CREATE_USER', entityType: 'user', entityId: 'u6', details: 'Created council user: Council Officer', createdAt: '2025-01-06T09:00:00Z' },
  { id: 'log2', userId: 'u1', userName: 'System Administrator', action: 'CREATE_CYCLE', entityType: 'haf_cycle', entityId: 'c3', details: 'Created cycle: Winter 2025', createdAt: '2025-01-10T09:00:00Z' },
  { id: 'log3', userId: 'u3', userName: 'Club Operator', action: 'CREATE_ACTIVITY', entityType: 'activity', entityId: 'a1', details: 'Created activity: Multi-Sports Camp', createdAt: '2025-02-01T09:00:00Z' },
  { id: 'log4', userId: 'u1', userName: 'System Administrator', action: 'BULK_UPLOAD', entityType: 'schools', entityId: '', details: 'Bulk uploaded 4 schools', createdAt: '2025-01-12T09:00:00Z' },
  { id: 'log5', userId: 'u1', userName: 'System Administrator', action: 'TOGGLE_CLUB_VISIBILITY', entityType: 'club', entityId: 'cl3', details: 'Set Adventure Outdoors visibility to false', createdAt: '2025-01-17T10:00:00Z' },
];

export const seedFsmChecks: FsmCheck[] = [
  { id: 'fsm1', childId: 'ch1', childName: 'Alex Guardian', checkerId: 'u3', checkerName: 'Club Operator', result: 'eligible', checkedAt: '2025-01-25T10:00:00Z' },
  { id: 'fsm2', childId: 'ch3', childName: 'Emily Smith', checkerId: 'u3', checkerName: 'Club Operator', result: 'eligible', checkedAt: '2025-01-26T10:00:00Z' },
  { id: 'fsm3', childId: 'ch2', childName: 'Sam Guardian', checkerId: 'u3', checkerName: 'Club Operator', result: 'not_eligible', checkedAt: '2025-01-27T10:00:00Z' },
];
