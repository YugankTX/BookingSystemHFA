import { useState } from 'react';
import { useStore } from '../../lib/store';
import { useAuth } from '../../lib/auth';
import { PageHeader, StatCard, Table, Td, StatusBadge, RoleBadge, EmptyState } from '../../components/ui';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { exportToCsv, formatDate, formatDateTime } from '../../lib/utils';
import type { User, Role } from '../../lib/types';
import { Users, Calendar, Upload, FileText, Building2, ScrollText, Shield, Plus, Edit2, Trash2, Download, UserPlus, Power, Eye, EyeOff } from 'lucide-react';

export function AdminDashboard() {
  const store = useStore();
  const activeUsers = store.users.filter(u => u.isActive).length;
  const pendingDeletions = store.deletionRequests.filter(d => d.status === 'pending').length;

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Program governance and system oversight" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Users" value={activeUsers} icon={<Users size={22} />} />
        <StatCard label="HAF Cycles" value={store.cycles.length} icon={<Calendar size={22} />} color="accent" />
        <StatCard label="Pending Deletions" value={pendingDeletions} icon={<FileText size={22} />} color="warning" />
        <StatCard label="Clubs" value={store.clubs.length} icon={<Building2 size={22} />} color="accent" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Recent System Logs</h3>
          <div className="space-y-3">
            {store.logs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <ScrollText size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-slate-700 font-medium">{log.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-400">{log.details} · {formatDateTime(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Pending Deletion Requests</h3>
          {store.deletionRequests.filter(d => d.status === 'pending').length === 0 ? (
            <EmptyState icon={<FileText size={28} />} title="No pending requests" message="All deletion requests have been processed." />
          ) : (
            <div className="space-y-3">
              {store.deletionRequests.filter(d => d.status === 'pending').map(req => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-warning-50 border border-warning-200">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{req.parentName}</p>
                    <p className="text-xs text-slate-500">{req.reason}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminUsers() {
  const store = useStore();
  const auth = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', role: 'council' as Role, phone: '' });

  const openCreate = () => {
    setEditUser(null);
    setForm({ fullName: '', email: '', role: 'council', phone: '' });
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setForm({ fullName: user.fullName, email: user.email, role: user.role, phone: user.phone });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editUser) {
      store.updateUser(editUser.id, form);
    } else {
      store.createUser({ ...form, isActive: true });
    }
    setModalOpen(false);
  };

  const handleExport = () => {
    exportToCsv('users', store.users.map(u => ({
      Name: u.fullName, Email: u.email, Role: u.role, Phone: u.phone, Active: u.isActive ? 'Yes' : 'No', Created: formatDate(u.createdAt),
    })));
  };

  const canDelete = (user: User) => user.id !== auth.user?.id;

  return (
    <div>
      <PageHeader title="User Management" subtitle="Create and manage admin and council users"
        actions={<>
          <button onClick={handleExport} className="btn-secondary"><Download size={16} /> Export</button>
          <button onClick={openCreate} className="btn-primary"><UserPlus size={16} /> Add User</button>
        </>} />

      <div className="card">
        <Table headers={['Name', 'Email', 'Role', 'Phone', 'Status', 'Created', 'Actions']}>
          {store.users.map(user => (
            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
              <Td className="font-medium text-slate-900">{user.fullName}</Td>
              <Td>{user.email}</Td>
              <Td><RoleBadge role={user.role} /></Td>
              <Td>{user.phone || '—'}</Td>
              <Td><StatusBadge status={user.isActive ? 'active' : 'inactive'} /></Td>
              <Td>{formatDate(user.createdAt)}</Td>
              <Td>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg text-slate-400 hover:bg-primary-50 hover:text-primary-600" title="Edit"><Edit2 size={16} /></button>
                  {!user.isActive && <button onClick={() => store.reactivateUser(user.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-accent-50 hover:text-accent-600" title="Reactivate"><Power size={16} /></button>}
                  {canDelete(user) && <button onClick={() => setDeleteTarget(user)} className="p-1.5 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600" title="Delete"><Trash2 size={16} /></button>}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Full Name</label><input className="input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}>
              <option value="admin">Admin</option>
              <option value="council">Council</option>
              <option value="club">Club</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editUser ? 'Save Changes' : 'Create User'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && store.deleteUser(deleteTarget.id)}
        title="Delete User" message={`Are you sure you want to delete ${deleteTarget?.fullName}? This action cannot be undone.`}
        confirmLabel="Delete" danger
      />
    </div>
  );
}

export function AdminCycles() {
  const store = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editCycle, setEditCycle] = useState<typeof store.cycles[0] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<typeof store.cycles[0] | null>(null);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', status: 'draft' as 'draft' | 'active' | 'closed' });

  const openCreate = () => { setEditCycle(null); setForm({ name: '', startDate: '', endDate: '', status: 'draft' }); setModalOpen(true); };
  const openEdit = (cycle: typeof store.cycles[0]) => { setEditCycle(cycle); setForm({ name: cycle.name, startDate: cycle.startDate, endDate: cycle.endDate, status: cycle.status }); setModalOpen(true); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editCycle) store.updateCycle(editCycle.id, form); else store.createCycle(form);
    setModalOpen(false);
  };

  return (
    <div>
      <PageHeader title="HAF Cycles" subtitle="Create and manage HAF programme cycles"
        actions={<button onClick={openCreate} className="btn-primary"><Plus size={16} /> New Cycle</button>} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {store.cycles.map(cycle => (
          <div key={cycle.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-900">{cycle.name}</h3>
                <p className="text-xs text-slate-400 mt-1">Created {formatDate(cycle.createdAt)}</p>
              </div>
              <StatusBadge status={cycle.status} />
            </div>
            <div className="text-sm text-slate-600 space-y-1">
              <p><span className="text-slate-400">Start:</span> {formatDate(cycle.startDate)}</p>
              <p><span className="text-slate-400">End:</span> {formatDate(cycle.endDate)}</p>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={() => openEdit(cycle)} className="btn-ghost text-xs"><Edit2 size={14} /> Edit</button>
              <button onClick={() => setDeleteTarget(cycle)} className="btn-ghost text-xs text-error-600 hover:bg-error-50"><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editCycle ? 'Edit Cycle' : 'New HAF Cycle'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Cycle Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Easter 2025" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Start Date</label><input type="date" className="input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required /></div>
            <div><label className="label">End Date</label><input type="date" className="input" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required /></div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'draft' | 'active' | 'closed' })}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editCycle ? 'Save Changes' : 'Create Cycle'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && store.deleteCycle(deleteTarget.id)}
        title="Delete Cycle" message={`Delete "${deleteTarget?.name}"? This cannot be undone.`} confirmLabel="Delete" danger />
    </div>
  );
}

export function AdminBulkUploads() {
  const store = useStore();
  const [uploadType, setUploadType] = useState<'schools' | 'clubs' | 'activities' | 'children'>('schools');
  const [csvText, setCsvText] = useState('');
  const [result, setResult] = useState('');

  const handleUpload = () => {
    if (!csvText.trim()) { setResult('Please paste CSV data first'); return; }
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => obj[h] = vals[i] ?? '');
      return obj;
    });

    if (uploadType === 'schools') {
      store.bulkUploadSchools(rows.map(r => ({ id: `s-${Date.now()}-${Math.random()}`, name: r.name ?? '', urn: r.urn ?? '', address: r.address ?? '' })));
    } else if (uploadType === 'clubs') {
      store.bulkUploadClubs(rows.map(r => ({ id: `cl-${Date.now()}-${Math.random()}`, userId: '', name: r.name ?? '', description: r.description ?? '', contactEmail: r.contactEmail ?? '', address: r.address ?? '', phone: r.phone ?? '', isVisible: true, logoUrl: '', createdAt: new Date().toISOString() })));
    } else if (uploadType === 'activities') {
      store.bulkUploadActivities(rows.map(r => ({ id: `a-${Date.now()}-${Math.random()}`, clubId: r.clubId ?? '', cycleId: r.cycleId ?? '', title: r.title ?? '', description: r.description ?? '', startDate: r.startDate ?? '', endDate: r.endDate ?? '', startTime: r.startTime ?? '', endTime: r.endTime ?? '', capacity: parseInt(r.capacity ?? '0') || 0, location: r.location ?? '', ageMin: parseInt(r.ageMin ?? '0') || 0, ageMax: parseInt(r.ageMax ?? '0') || 0, createdAt: new Date().toISOString() })));
    } else if (uploadType === 'children') {
      store.bulkUploadChildren(rows.map(r => ({ id: `ch-${Date.now()}-${Math.random()}`, parentId: r.parentId ?? '', fullName: r.fullName ?? '', dateOfBirth: r.dateOfBirth ?? '', schoolId: r.schoolId || null, fsmEligible: r.fsmEligible === 'true', fsmVerifiedAt: null, fsmReference: null, createdAt: new Date().toISOString() })));
    }
    setResult(`Successfully uploaded ${rows.length} ${uploadType} records.`);
    setCsvText('');
  };

  const templates: Record<string, string> = {
    schools: 'name,urn,address\nRiverside Primary,100005,1 River Lane\nNewfield Academy,100006,2 Newfield Rd',
    clubs: 'name,description,contactEmail,address,phone\nSports Club,Football training,info@sports.co.uk,10 Sports Rd,020 7000 0100',
    activities: 'clubId,cycleId,title,startDate,endDate,startTime,endTime,capacity,location,ageMin,ageMax\ncl1,c1,Tennis,2025-04-07,2025-04-11,09:00,12:00,20,Court 1,6,12',
    children: 'parentId,fullName,dateOfBirth,schoolId,fsmEligible\np1,New Child,2016-05-10,s1,true',
  };

  return (
    <div>
      <PageHeader title="Bulk Uploads" subtitle="Upload schools, clubs, activities, and child FSM datasets" />
      <div className="card p-5 mb-4">
        <label className="label">Upload Type</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {(['schools', 'clubs', 'activities', 'children'] as const).map(t => (
            <button key={t} onClick={() => { setUploadType(t); setCsvText(''); setResult(''); }}
              className={`rounded-lg border p-3 text-sm font-medium capitalize transition-all ${uploadType === t ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 hover:border-slate-300'}`}>
              {t === 'children' ? 'Child FSM Dataset' : t}
            </button>
          ))}
        </div>
        <div className="mb-3">
          <button onClick={() => setCsvText(templates[uploadType])} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            Load sample template
          </button>
        </div>
        <textarea className="input font-mono text-xs h-48 resize-y" placeholder="Paste CSV data here (headers on first line)..." value={csvText} onChange={e => setCsvText(e.target.value)} />
        {result && <div className="mt-3 rounded-lg bg-accent-50 border border-accent-200 px-3 py-2 text-sm text-accent-700">{result}</div>}
        <div className="flex justify-end mt-4">
          <button onClick={handleUpload} className="btn-primary"><Upload size={16} /> Upload Data</button>
        </div>
      </div>
    </div>
  );
}

export function AdminDeletionRequests() {
  const store = useStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'processed' | 'rejected'>('all');

  const filtered = store.deletionRequests.filter(d => filter === 'all' || d.status === filter);

  const handleExport = () => {
    exportToCsv('deletion-requests', filtered.map(d => ({
      Parent: d.parentName, Reason: d.reason, Status: d.status, Requested: formatDateTime(d.requestedAt), Processed: d.processedAt ? formatDateTime(d.processedAt) : '—',
    })));
  };

  return (
    <div>
      <PageHeader title="Data Deletion Requests" subtitle="View and process user data deletion requests"
        actions={<button onClick={handleExport} className="btn-secondary"><Download size={16} /> Export</button>} />
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'processed', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {f}
          </button>
        ))}
      </div>
      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState icon={<FileText size={28} />} title="No requests" message="No deletion requests match this filter." />
        ) : (
          <Table headers={['Parent', 'Reason', 'Status', 'Requested', 'Processed', 'Actions']}>
            {filtered.map(req => (
              <tr key={req.id} className="hover:bg-slate-50">
                <Td className="font-medium">{req.parentName}</Td>
                <Td>{req.reason}</Td>
                <Td><StatusBadge status={req.status} /></Td>
                <Td>{formatDateTime(req.requestedAt)}</Td>
                <Td>{req.processedAt ? formatDateTime(req.processedAt) : '—'}</Td>
                <Td>
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => store.processDeletionRequest(req.id, 'processed')} className="btn-secondary text-xs py-1">Process</button>
                      <button onClick={() => store.processDeletionRequest(req.id, 'rejected')} className="btn-ghost text-xs text-error-600 py-1">Reject</button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
}

export function AdminClubSettings() {
  const store = useStore();
  const [editClub, setEditClub] = useState<typeof store.clubs[0] | null>(null);
  const [form, setForm] = useState({ name: '', contactEmail: '', isVisible: true });

  const openEdit = (club: typeof store.clubs[0]) => { setEditClub(club); setForm({ name: club.name, contactEmail: club.contactEmail, isVisible: club.isVisible }); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editClub) store.updateClub(editClub.id, form);
    setEditClub(null);
  };

  return (
    <div>
      <PageHeader title="Club Settings" subtitle="Manage club visibility and contact email settings" />
      <div className="card">
        <Table headers={['Club', 'Contact Email', 'Phone', 'Visible', 'Actions']}>
          {store.clubs.map(club => (
            <tr key={club.id} className="hover:bg-slate-50">
              <Td className="font-medium">{club.name}</Td>
              <Td>{club.contactEmail}</Td>
              <Td>{club.phone}</Td>
              <Td>
                <button onClick={() => store.toggleClubVisibility(club.id)} className="flex items-center gap-1.5 text-slate-600 hover:text-primary-600">
                  {club.isVisible ? <><Eye size={15} className="text-accent-600" /> Visible</> : <><EyeOff size={15} className="text-slate-400" /> Hidden</>}
                </button>
              </Td>
              <Td><button onClick={() => openEdit(club)} className="btn-ghost text-xs"><Edit2 size={14} /> Edit</button></Td>
            </tr>
          ))}
        </Table>
      </div>

      <Modal open={!!editClub} onClose={() => setEditClub(null)} title="Edit Club Settings">
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Club Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">Contact Email</label><input type="email" className="input" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditClub(null)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function AdminLogs() {
  const store = useStore();

  const handleExport = () => {
    exportToCsv('system-logs', store.logs.map(l => ({
      User: l.userName, Action: l.action, Entity: l.entityType, Details: l.details, Timestamp: formatDateTime(l.createdAt),
    })));
  };

  return (
    <div>
      <PageHeader title="System Logs" subtitle="Audit trail of all system actions"
        actions={<button onClick={handleExport} className="btn-secondary"><Download size={16} /> Export</button>} />
      <div className="card">
        <Table headers={['User', 'Action', 'Entity', 'Details', 'Timestamp']}>
          {store.logs.map(log => (
            <tr key={log.id} className="hover:bg-slate-50">
              <Td className="font-medium">{log.userName}</Td>
              <Td><span className="badge-info">{log.action.replace(/_/g, ' ')}</span></Td>
              <Td>{log.entityType || '—'}</Td>
              <Td className="text-slate-500">{log.details}</Td>
              <Td>{formatDateTime(log.createdAt)}</Td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}

export function AdminReports() {
  const store = useStore();

  const reports = [
    { label: 'All Users', icon: Users, desc: 'Complete user list with roles and status', action: () => exportToCsv('all-users', store.users.map(u => ({ Name: u.fullName, Email: u.email, Role: u.role, Phone: u.phone, Active: u.isActive, Created: formatDate(u.createdAt) }))) },
    { label: 'All Clubs', icon: Building2, desc: 'Club directory with visibility status', action: () => exportToCsv('all-clubs', store.clubs.map(c => ({ Name: c.name, Email: c.contactEmail, Phone: c.phone, Address: c.address, Visible: c.isVisible, Created: formatDate(c.createdAt) }))) },
    { label: 'All Activities', icon: Calendar, desc: 'Every activity across all clubs and cycles', action: () => exportToCsv('all-activities', store.activities.map(a => ({ Title: a.title, Club: store.clubs.find(c => c.id === a.clubId)?.name ?? '', StartDate: a.startDate, EndDate: a.endDate, Capacity: a.capacity, Location: a.location, AgeRange: `${a.ageMin}-${a.ageMax}` }))) },
    { label: 'Cumulative Attendance', icon: FileText, desc: 'All attendance records system-wide', action: () => exportToCsv('cumulative-attendance', store.attendance.map(a => ({ Child: store.children.find(c => c.id === a.childId)?.fullName ?? '', Activity: store.activities.find(act => act.id === a.activityId)?.title ?? '', Date: a.date, Status: a.status, Notes: a.notes }))) },
    { label: 'Deletion Requests', icon: FileText, desc: 'All data deletion requests', action: () => exportToCsv('deletion-requests-report', store.deletionRequests.map(d => ({ Parent: d.parentName, Reason: d.reason, Status: d.status, Requested: formatDateTime(d.requestedAt), Processed: d.processedAt ? formatDateTime(d.processedAt) : '—' }))) },
    { label: 'System Logs', icon: ScrollText, desc: 'Complete audit trail', action: () => exportToCsv('system-logs-report', store.logs.map(l => ({ User: l.userName, Action: l.action, Details: l.details, Timestamp: formatDateTime(l.createdAt) }))) },
    { label: 'FSM Checks', icon: Shield, desc: 'All FSM eligibility verification records', action: () => exportToCsv('fsm-checks-report', store.fsmChecks.map(f => ({ Child: f.childName, Checker: f.checkerName, Result: f.result, CheckedAt: formatDateTime(f.checkedAt) }))) },
    { label: 'Annual Report Data', icon: FileText, desc: 'Summary data for annual report production', action: () => exportToCsv('annual-report', [
      { Metric: 'Total Users', Value: store.users.length },
      { Metric: 'Active Users', Value: store.users.filter(u => u.isActive).length },
      { Metric: 'Total Clubs', Value: store.clubs.length },
      { Metric: 'Visible Clubs', Value: store.clubs.filter(c => c.isVisible).length },
      { Metric: 'Total Activities', Value: store.activities.length },
      { Metric: 'Total Children', Value: store.children.length },
      { Metric: 'FSM Eligible Children', Value: store.children.filter(c => c.fsmEligible).length },
      { Metric: 'Total Attendance Records', Value: store.attendance.length },
      { Metric: 'Present Count', Value: store.attendance.filter(a => a.status === 'present').length },
      { Metric: 'Absent Count', Value: store.attendance.filter(a => a.status === 'absent').length },
      { Metric: 'Late Count', Value: store.attendance.filter(a => a.status === 'late').length },
      { Metric: 'HAF Cycles', Value: store.cycles.length },
      { Metric: 'Active Cycles', Value: store.cycles.filter(c => c.status === 'active').length },
      { Metric: 'Deletion Requests', Value: store.deletionRequests.length },
      { Metric: 'Pending Deletions', Value: store.deletionRequests.filter(d => d.status === 'pending').length },
    ]) },
  ];

  return (
    <div>
      <PageHeader title="System Reports" subtitle="Downloadable reports and data exports" />
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
