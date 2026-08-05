import { useState } from 'react';
import { useStore } from '../../lib/store';
import { useAuth } from '../../lib/auth';
import { PageHeader, StatCard, Table, Td, StatusBadge, EmptyState } from '../../components/ui';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { exportToCsv, formatDate, formatDateTime, calcAge } from '../../lib/utils';
import type { Activity } from '../../lib/types';
import { Calendar, Users, CheckCircle, FileText, Download, Plus, Edit2, Trash2, Building2, Shield, Search, Heart, X } from 'lucide-react';

function useClubData() {
  const store = useStore();
  const auth = useAuth();
  const myClubs = store.clubs.filter(c => c.userId === auth.user?.id);
  const myClubIds = myClubs.map(c => c.id);
  const myActivities = store.activities.filter(a => myClubIds.includes(a.clubId));
  const myActivityIds = myActivities.map(a => a.id);
  const myLinks = store.links.filter(l => myClubIds.includes(l.clubId));
  const myAttendance = store.attendance.filter(a => myActivityIds.includes(a.activityId));
  const myParents = store.parents.filter(p => p.clubId && myClubIds.includes(p.clubId));
  const myParentIds = myParents.map(p => p.id);
  const myChildren = store.children.filter(c => myParentIds.includes(c.parentId));
  return { store, myClubs, myActivities, myLinks, myAttendance, myParents, myChildren };
}

export function ClubDashboard() {
  const { store, myClubs, myActivities, myAttendance, myChildren } = useClubData();
  const presentCount = myAttendance.filter(a => a.status === 'present').length;
  const attendanceRate = myAttendance.length > 0 ? Math.round((presentCount / myAttendance.length) * 100) : 0;

  return (
    <div>
      <PageHeader title="Club Dashboard" subtitle="Overview of your club operations" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="My Clubs" value={myClubs.length} icon={<Building2 size={22} />} />
        <StatCard label="Activities" value={myActivities.length} icon={<Calendar size={22} />} color="accent" />
        <StatCard label="Children" value={myChildren.length} icon={<Users size={22} />} color="warning" />
        <StatCard label="Attendance Rate" value={`${attendanceRate}%`} icon={<CheckCircle size={22} />} color="accent" />
      </div>
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Recent Attendance</h3>
        {myAttendance.length === 0 ? (
          <EmptyState icon={<CheckCircle size={28} />} title="No attendance yet" message="Attendance records will appear here once you start recording." />
        ) : (
          <Table headers={['Child', 'Activity', 'Date', 'Status']}>
            {myAttendance.slice(0, 8).map(att => {
              const child = store.children.find(c => c.id === att.childId);
              const activity = store.activities.find(a => a.id === att.activityId);
              return (
                <tr key={att.id} className="hover:bg-slate-50">
                  <Td className="font-medium">{child?.fullName ?? '—'}</Td>
                  <Td>{activity?.title ?? '—'}</Td>
                  <Td>{formatDate(att.date)}</Td>
                  <Td><StatusBadge status={att.status} /></Td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>
    </div>
  );
}

export function ClubProfile() {
  const { store, myClubs } = useClubData();
  const [editClub, setEditClub] = useState<typeof store.clubs[0] | null>(null);
  const [form, setForm] = useState({ name: '', description: '', contactEmail: '', address: '', phone: '' });

  const openEdit = (club: typeof store.clubs[0]) => {
    setEditClub(club);
    setForm({ name: club.name, description: club.description, contactEmail: club.contactEmail, address: club.address, phone: club.phone });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editClub) store.updateClub(editClub.id, form);
    setEditClub(null);
  };

  return (
    <div>
      <PageHeader title="Club Profile" subtitle="View and update your club information" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {myClubs.map(club => (
          <div key={club.id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{club.name}</h3>
                  <p className="text-xs text-slate-400">{club.isVisible ? 'Visible to parents' : 'Hidden from parents'}</p>
                </div>
              </div>
              <button onClick={() => openEdit(club)} className="btn-ghost text-xs"><Edit2 size={14} /> Edit</button>
            </div>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-slate-400">Description</dt><dd className="text-slate-700">{club.description || '—'}</dd></div>
              <div><dt className="text-slate-400">Contact Email</dt><dd className="text-slate-700">{club.contactEmail || '—'}</dd></div>
              <div><dt className="text-slate-400">Phone</dt><dd className="text-slate-700">{club.phone || '—'}</dd></div>
              <div><dt className="text-slate-400">Address</dt><dd className="text-slate-700">{club.address || '—'}</dd></div>
            </dl>
          </div>
        ))}
      </div>

      <Modal open={!!editClub} onClose={() => setEditClub(null)} title="Edit Club Profile" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Club Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Contact Email</label><input type="email" className="input" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div><label className="label">Address</label><input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditClub(null)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function ClubActivities() {
  const { store, myClubs, myActivities } = useClubData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [form, setForm] = useState({
    clubId: '', cycleId: '', title: '', description: '', startDate: '', endDate: '',
    startTime: '', endTime: '', capacity: 0, location: '', ageMin: 0, ageMax: 0,
  });

  const openCreate = () => {
    setEditActivity(null);
    setForm({ clubId: myClubs[0]?.id ?? '', cycleId: store.cycles[0]?.id ?? '', title: '', description: '', startDate: '', endDate: '', startTime: '', endTime: '', capacity: 20, location: '', ageMin: 5, ageMax: 12 });
    setModalOpen(true);
  };

  const openEdit = (activity: Activity) => {
    setEditActivity(activity);
    setForm({ clubId: activity.clubId, cycleId: activity.cycleId, title: activity.title, description: activity.description, startDate: activity.startDate, endDate: activity.endDate, startTime: activity.startTime, endTime: activity.endTime, capacity: activity.capacity, location: activity.location, ageMin: activity.ageMin, ageMax: activity.ageMax });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editActivity) store.updateActivity(editActivity.id, form);
    else store.createActivity(form);
    setModalOpen(false);
  };

  return (
    <div>
      <PageHeader title="Activities" subtitle="Create and manage activities for your clubs"
        actions={<button onClick={openCreate} className="btn-primary"><Plus size={16} /> New Activity</button>} />
      {myActivities.length === 0 ? (
        <div className="card"><EmptyState icon={<Calendar size={28} />} title="No activities" message="Create your first activity to get started." /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myActivities.map(activity => {
            const club = myClubs.find(c => c.id === activity.clubId);
            const cycle = store.cycles.find(c => c.id === activity.cycleId);
            const enrolled = store.links.filter(l => l.activityId === activity.id && l.status === 'active').length;
            return (
              <div key={activity.id} className="card p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900">{activity.title}</h3>
                  <StatusBadge status={cycle?.status ?? 'draft'} />
                </div>
                <p className="text-sm text-slate-500 mb-3">{activity.description || 'No description'}</p>
                <div className="text-xs text-slate-500 space-y-1 mb-4">
                  <p>{club?.name} · {cycle?.name}</p>
                  <p>{formatDate(activity.startDate)} — {formatDate(activity.endDate)}</p>
                  <p>{activity.startTime}–{activity.endTime} · {activity.location}</p>
                  <p>Ages {activity.ageMin}–{activity.ageMax} · {enrolled}/{activity.capacity} enrolled</p>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button onClick={() => openEdit(activity)} className="btn-ghost text-xs"><Edit2 size={14} /> Edit</button>
                  <button onClick={() => setDeleteTarget(activity)} className="btn-ghost text-xs text-error-600 hover:bg-error-50"><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editActivity ? 'Edit Activity' : 'New Activity'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Title</label><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Club</label><select className="input" value={form.clubId} onChange={e => setForm({ ...form, clubId: e.target.value })}>{myClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="label">Cycle</label><select className="input" value={form.cycleId} onChange={e => setForm({ ...form, cycleId: e.target.value })}>{store.cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Start Date</label><input type="date" className="input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><label className="label">End Date</label><input type="date" className="input" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Start Time</label><input type="time" className="input" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} /></div>
            <div><label className="label">End Time</label><input type="time" className="input" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} /></div>
            <div><label className="label">Capacity</label><input type="number" className="input" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Location</label><input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
            <div><label className="label">Min Age</label><input type="number" className="input" value={form.ageMin} onChange={e => setForm({ ...form, ageMin: parseInt(e.target.value) || 0 })} /></div>
            <div><label className="label">Max Age</label><input type="number" className="input" value={form.ageMax} onChange={e => setForm({ ...form, ageMax: parseInt(e.target.value) || 0 })} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editActivity ? 'Save Changes' : 'Create Activity'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && store.deleteActivity(deleteTarget.id)}
        title="Delete Activity" message={`Delete "${deleteTarget?.title}"? This cannot be undone.`} confirmLabel="Delete" danger />
    </div>
  );
}

export function ClubAttendance() {
  const { store, myActivities, myChildren, myLinks } = useClubData();
  const [selectedActivity, setSelectedActivity] = useState<string>(myActivities[0]?.id ?? '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const activity = myActivities.find(a => a.id === selectedActivity);
  const linkedChildIds = myLinks.filter(l => l.activityId === selectedActivity && l.status === 'active').map(l => l.childId);
  const linkedChildren = myChildren.filter(c => linkedChildIds.includes(c.id));

  const existingRecords = store.attendance.filter(a => a.activityId === selectedActivity && a.date === selectedDate);
  const getRecord = (childId: string) => existingRecords.find(r => r.childId === childId);

  const setStatus = (childId: string, status: 'present' | 'absent' | 'late') => {
    const existing = getRecord(childId);
    if (existing) {
      store.updateAttendance(existing.id, { status });
    } else {
      store.createAttendance({ activityId: selectedActivity, childId, date: selectedDate, status, notes: '' });
    }
  };

  const handleExport = () => {
    exportToCsv('attendance-records', store.attendance.filter(a => a.activityId === selectedActivity).map(a => ({
      Child: store.children.find(c => c.id === a.childId)?.fullName ?? '',
      Activity: activity?.title ?? '', Date: a.date, Status: a.status, Notes: a.notes, RecordedAt: formatDateTime(a.recordedAt),
    })));
  };

  return (
    <div>
      <PageHeader title="Attendance Records" subtitle="Record and manage daily attendance"
        actions={<button onClick={handleExport} className="btn-secondary"><Download size={16} /> Export</button>} />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Activity</label>
            <select className="input" value={selectedActivity} onChange={e => setSelectedActivity(e.target.value)}>
              {myActivities.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        {linkedChildren.length === 0 ? (
          <EmptyState icon={<Users size={28} />} title="No children enrolled" message="No children are linked to this activity yet." />
        ) : (
          <Table headers={['Child', 'Age', 'Status', 'Actions']}>
            {linkedChildren.map(child => {
              const record = getRecord(child.id);
              const status = record?.status ?? 'present';
              return (
                <tr key={child.id} className="hover:bg-slate-50">
                  <Td className="font-medium">{child.fullName}</Td>
                  <Td>{child.dateOfBirth ? calcAge(child.dateOfBirth) : '—'}</Td>
                  <Td><StatusBadge status={status} /></Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => setStatus(child.id, 'present')} className={`px-2.5 py-1 rounded-md text-xs font-medium ${status === 'present' ? 'bg-accent-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-accent-50'}`}>Present</button>
                      <button onClick={() => setStatus(child.id, 'absent')} className={`px-2.5 py-1 rounded-md text-xs font-medium ${status === 'absent' ? 'bg-error-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-error-50'}`}>Absent</button>
                      <button onClick={() => setStatus(child.id, 'late')} className={`px-2.5 py-1 rounded-md text-xs font-medium ${status === 'late' ? 'bg-warning-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-warning-50'}`}>Late</button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>
    </div>
  );
}

export function ClubParticipation() {
  const { store, myLinks } = useClubData();

  const handleExport = () => {
    exportToCsv('participation-confirmation', myLinks.map(l => {
      const child = store.children.find(c => c.id === l.childId);
      const parent = store.parents.find(p => p.id === child?.parentId);
      const activity = store.activities.find(a => a.id === l.activityId);
      const club = store.clubs.find(c => c.id === l.clubId);
      return { Child: child?.fullName ?? '', Parent: parent?.fullName ?? '', Club: club?.name ?? '', Activity: activity?.title ?? '', Status: l.status, LinkedAt: formatDate(l.linkedAt) };
    }));
  };

  return (
    <div>
      <PageHeader title="Child Participation" subtitle="View and manage child participation confirmations"
        actions={<button onClick={handleExport} className="btn-secondary"><Download size={16} /> Export</button>} />
      <div className="card">
        {myLinks.length === 0 ? (
          <EmptyState icon={<Heart size={28} />} title="No participation" message="No children are linked to your clubs yet." />
        ) : (
          <Table headers={['Child', 'Parent', 'Club', 'Activity', 'Status', 'Linked']}>
            {myLinks.map(link => {
              const child = store.children.find(c => c.id === link.childId);
              const parent = store.parents.find(p => p.id === child?.parentId);
              const club = store.clubs.find(c => c.id === link.clubId);
              const activity = store.activities.find(a => a.id === link.activityId);
              return (
                <tr key={link.id} className="hover:bg-slate-50">
                  <Td className="font-medium">{child?.fullName ?? '—'}</Td>
                  <Td>{parent?.fullName ?? '—'}</Td>
                  <Td>{club?.name ?? '—'}</Td>
                  <Td>{activity?.title ?? '—'}</Td>
                  <Td><StatusBadge status={link.status} /></Td>
                  <Td>{formatDate(link.linkedAt)}</Td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>
    </div>
  );
}

export function ClubFsm() {
  const { store, myChildren } = useClubData();
  const [search, setSearch] = useState('');

  const filtered = myChildren.filter(c => c.fullName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="FSM Verification Checks" subtitle="Run Free School Meal eligibility verification for children" />
      <div className="card p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input className="input pl-10" placeholder="Search children..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState icon={<Shield size={28} />} title="No children" message="No children found to verify." />
        ) : (
          <Table headers={['Child', 'Age', 'FSM Eligible', 'Verified At', 'Reference', 'Actions']}>
            {filtered.map(child => (
              <tr key={child.id} className="hover:bg-slate-50">
                <Td className="font-medium">{child.fullName}</Td>
                <Td>{child.dateOfBirth ? calcAge(child.dateOfBirth) : '—'}</Td>
                <Td><StatusBadge status={child.fsmEligible ? 'eligible' : 'not_eligible'} /></Td>
                <Td>{child.fsmVerifiedAt ? formatDateTime(child.fsmVerifiedAt) : 'Not verified'}</Td>
                <Td>{child.fsmReference ?? '—'}</Td>
                <Td><button onClick={() => store.runFsmCheck(child.id)} className="btn-secondary text-xs py-1.5"><Shield size={14} /> Run Check</button></Td>
              </tr>
            ))}
          </Table>
        )}
      </div>
      {store.fsmChecks.length > 0 && (
        <div className="card mt-6">
          <h3 className="font-semibold text-slate-900 px-5 pt-5 mb-3">Recent FSM Checks</h3>
          <Table headers={['Child', 'Checker', 'Result', 'Checked At']}>
            {store.fsmChecks.slice(0, 10).map(check => (
              <tr key={check.id} className="hover:bg-slate-50">
                <Td className="font-medium">{check.childName}</Td>
                <Td>{check.checkerName}</Td>
                <Td><StatusBadge status={check.result} /></Td>
                <Td>{formatDateTime(check.checkedAt)}</Td>
              </tr>
            ))}
          </Table>
        </div>
      )}
    </div>
  );
}

export function ClubParents() {
  const { store, myParents, myChildren } = useClubData();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', address: '' });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'parent' | 'child' | 'carer'; name: string } | null>(null);

  const handleCreateParent = (e: React.FormEvent) => {
    e.preventDefault();
    store.createParent({ ...form, userId: '', clubId: myParents[0]?.clubId ?? store.clubs[0]?.id ?? null });
    setModalOpen(false);
    setForm({ fullName: '', email: '', phone: '', address: '' });
  };

  return (
    <div>
      <PageHeader title="Parents & Children" subtitle="Register and manage parent, child, and carer records"
        actions={<button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> Add Parent</button>} />

      <div className="space-y-4">
        {myParents.map(parent => {
          const parentChildren = myChildren.filter(c => c.parentId === parent.id);
          const carers = store.carers.filter(cr => cr.parentId === parent.id);
          return (
            <div key={parent.id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{parent.fullName}</h3>
                  <p className="text-xs text-slate-400">{parent.email} · {parent.phone}</p>
                </div>
                <button onClick={() => setDeleteTarget({ id: parent.id, type: 'parent', name: parent.fullName })} className="p-1.5 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600"><Trash2 size={16} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Children</h4>
                  {parentChildren.length === 0 ? <p className="text-sm text-slate-400">No children</p> : (
                    <div className="space-y-2">
                      {parentChildren.map(child => (
                        <div key={child.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                          <div>
                            <p className="text-sm font-medium text-slate-700">{child.fullName}</p>
                            <p className="text-xs text-slate-400">Age {child.dateOfBirth ? calcAge(child.dateOfBirth) : '—'} · FSM: {child.fsmEligible ? 'Yes' : 'No'}</p>
                          </div>
                          <button onClick={() => setDeleteTarget({ id: child.id, type: 'child', name: child.fullName })} className="p-1 rounded text-slate-400 hover:bg-error-50 hover:text-error-600"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Carers</h4>
                  {carers.length === 0 ? <p className="text-sm text-slate-400">No carers</p> : (
                    <div className="space-y-2">
                      {carers.map(carer => (
                        <div key={carer.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                          <div>
                            <p className="text-sm font-medium text-slate-700">{carer.fullName}</p>
                            <p className="text-xs text-slate-400">{carer.relationship} · {carer.phone}</p>
                          </div>
                          <button onClick={() => setDeleteTarget({ id: carer.id, type: 'carer', name: carer.fullName })} className="p-1 rounded text-slate-400 hover:bg-error-50 hover:text-error-600"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Parent Record">
        <form onSubmit={handleCreateParent} className="space-y-4">
          <div><label className="label">Full Name</label><input className="input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">Address</label><input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Parent</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === 'parent') store.deleteParent(deleteTarget.id);
          else if (deleteTarget.type === 'child') store.deleteChild(deleteTarget.id);
          else store.deleteCarer(deleteTarget.id);
        }}
        title={`Delete ${deleteTarget?.type ?? ''}`} message={`Delete "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete" danger />
    </div>
  );
}

export function ClubReports() {
  const { store, myActivities, myAttendance, myLinks, myClubs } = useClubData();

  const reports = [
    {
      label: 'Attendance Report',
      icon: CheckCircle,
      desc: 'All attendance records for your clubs',
      action: () => exportToCsv('club-attendance', myAttendance.map(a => ({
        Child: store.children.find(c => c.id === a.childId)?.fullName ?? '',
        Activity: store.activities.find(act => act.id === a.activityId)?.title ?? '',
        Date: a.date, Status: a.status, Notes: a.notes, RecordedAt: formatDateTime(a.recordedAt),
      }))),
    },
    {
      label: 'Activity Report',
      icon: Calendar,
      desc: 'All your activities with enrollment details',
      action: () => exportToCsv('club-activities', myActivities.map(a => {
        const enrolled = myLinks.filter(l => l.activityId === a.id && l.status === 'active').length;
        return { Title: a.title, StartDate: a.startDate, EndDate: a.endDate, StartTime: a.startTime, EndTime: a.endTime, Capacity: a.capacity, Enrolled: enrolled, Location: a.location, AgeRange: `${a.ageMin}-${a.ageMax}` };
      })),
    },
    {
      label: 'Operational Outputs',
      icon: FileText,
      desc: 'Combined operational data export',
      action: () => exportToCsv('club-operational-outputs', myClubs.map(c => {
        const activities = myActivities.filter(a => a.clubId === c.id);
        const children = myLinks.filter(l => l.clubId === c.id && l.status === 'active').length;
        const attendance = myAttendance.filter(a => activities.some(act => act.id === a.activityId));
        return { Club: c.name, Activities: activities.length, ChildrenEnrolled: children, AttendanceRecords: attendance.length, Present: attendance.filter(a => a.status === 'present').length, Absent: attendance.filter(a => a.status === 'absent').length, Late: attendance.filter(a => a.status === 'late').length };
      })),
    },
  ];

  return (
    <div>
      <PageHeader title="Club Reports" subtitle="Download operational reports and outputs" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(r => {
          const Icon = r.icon;
          return (
            <button key={r.label} onClick={r.action} className="card p-5 text-left hover:shadow-md hover:border-primary-300 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 mb-3 group-hover:bg-primary-100 transition-colors">
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{r.label}</h3>
              <p className="text-sm text-slate-500">{r.desc}</p>
              <div className="flex items-center gap-1 text-primary-600 text-sm font-medium mt-3">
                <Download size={14} /> Download CSV
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
