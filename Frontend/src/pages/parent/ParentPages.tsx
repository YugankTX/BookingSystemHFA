import { useState } from 'react';
import { useStore } from '../../lib/store';
import { useAuth } from '../../lib/auth';
import { PageHeader, StatCard, Table, Td, StatusBadge, EmptyState } from '../../components/ui';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { formatDate, formatDateTime, calcAge } from '../../lib/utils';
import type { Child, Carer } from '../../lib/types';
import { Heart, Users, Shield, Plus, Edit2, Trash2, Link2, Unlink, FileText, CheckCircle } from 'lucide-react';

function useParentData() {
  const store = useStore();
  const auth = useAuth();
  const myParents = store.parents.filter(p => p.userId === auth.user?.id);
  const myParentIds = myParents.map(p => p.id);
  const myChildren = store.children.filter(c => myParentIds.includes(c.parentId));
  const myChildIds = myChildren.map(c => c.id);
  const myCarers = store.carers.filter(cr => myParentIds.includes(cr.parentId));
  const myLinks = store.links.filter(l => myChildIds.includes(l.childId));
  return { store, auth, myParents, myChildren, myCarers, myLinks };
}

export function ParentDashboard() {
  const { store, myChildren, myLinks, myCarers } = useParentData();
  const fsmEligible = myChildren.filter(c => c.fsmEligible).length;
  const activeLinks = myLinks.filter(l => l.status === 'active').length;

  return (
    <div>
      <PageHeader title="Parent Dashboard" subtitle="Manage your family's HAF participation" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Children" value={myChildren.length} icon={<Heart size={22} />} />
        <StatCard label="FSM Eligible" value={fsmEligible} icon={<Shield size={22} />} color="accent" />
        <StatCard label="Active Links" value={activeLinks} icon={<Link2 size={22} />} color="warning" />
        <StatCard label="Carers" value={myCarers.length} icon={<Users size={22} />} color="accent" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">My Children</h3>
          {myChildren.length === 0 ? (
            <EmptyState icon={<Heart size={28} />} title="No children" message="Add your children to get started." />
          ) : (
            <div className="space-y-3">
              {myChildren.map(child => (
                <div key={child.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{child.fullName}</p>
                    <p className="text-xs text-slate-400">Age {child.dateOfBirth ? calcAge(child.dateOfBirth) : '—'} · {store.schools.find(s => s.id === child.schoolId)?.name ?? 'No school'}</p>
                  </div>
                  <StatusBadge status={child.fsmEligible ? 'eligible' : 'not_eligible'} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">My Bookings</h3>
          {myLinks.filter(l => l.status === 'active').length === 0 ? (
            <EmptyState icon={<Link2 size={28} />} title="No bookings" message="Book your children into activities to get started." />
          ) : (
            <div className="space-y-3">
              {myLinks.filter(l => l.status === 'active').map(link => {
                const child = myChildren.find(c => c.id === link.childId);
                const club = store.clubs.find(c => c.id === link.clubId);
                const activity = store.activities.find(a => a.id === link.activityId);
                return (
                  <div key={link.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{child?.fullName} → {club?.name}</p>
                      <p className="text-xs text-slate-400">{activity?.title ?? 'No specific activity'}</p>
                    </div>
                    <StatusBadge status={link.status} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ParentProfile() {
  const { store, auth, myParents } = useParentData();
  const [form, setForm] = useState({ fullName: auth.user?.fullName ?? '', email: auth.user?.email ?? '', phone: auth.user?.phone ?? '', address: '' });
  const [saved, setSaved] = useState(false);

  const parentRecord = myParents[0];
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (auth.user) store.updateUser(auth.user.id, { fullName: form.fullName, phone: form.phone });
    if (parentRecord) store.updateParent(parentRecord.id, { fullName: form.fullName, email: form.email, phone: form.phone, address: form.address });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <PageHeader title="My Profile" subtitle="View and update your personal information" />
      <div className="card p-6 max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Full Name</label><input className="input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">Address</label><input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary">Save Changes</button>
            {saved && <span className="text-sm text-accent-600 flex items-center gap-1"><CheckCircle size={16} /> Saved</span>}
          </div>
        </form>
      </div>
    </div>
  );
}

export function ParentChildren() {
  const { store, myParents, myChildren } = useParentData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editChild, setEditChild] = useState<Child | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Child | null>(null);
  const [form, setForm] = useState({ fullName: '', dateOfBirth: '', schoolId: '' });

  const openCreate = () => { setEditChild(null); setForm({ fullName: '', dateOfBirth: '', schoolId: '' }); setModalOpen(true); };
  const openEdit = (child: Child) => { setEditChild(child); setForm({ fullName: child.fullName, dateOfBirth: child.dateOfBirth, schoolId: child.schoolId ?? '' }); setModalOpen(true); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parentId = myParents[0]?.id ?? '';
    if (!parentId) return;
    if (editChild) {
      store.updateChild(editChild.id, { fullName: form.fullName, dateOfBirth: form.dateOfBirth, schoolId: form.schoolId || null });
    } else {
      store.createChild({ parentId, fullName: form.fullName, dateOfBirth: form.dateOfBirth, schoolId: form.schoolId || null, fsmEligible: false, fsmVerifiedAt: null, fsmReference: null });
    }
    setModalOpen(false);
  };

  return (
    <div>
      <PageHeader title="Children" subtitle="Add, edit, and manage your child records"
        actions={<button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Child</button>} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myChildren.map(child => (
          <div key={child.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center text-warning-600">
                  <Heart size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{child.fullName}</h3>
                  <p className="text-xs text-slate-400">Age {child.dateOfBirth ? calcAge(child.dateOfBirth) : '—'}</p>
                </div>
              </div>
            </div>
            <div className="text-sm space-y-1 mb-3">
              <p><span className="text-slate-400">School:</span> {store.schools.find(s => s.id === child.schoolId)?.name ?? '—'}</p>
              <p><span className="text-slate-400">FSM:</span> <StatusBadge status={child.fsmEligible ? 'eligible' : 'not_eligible'} /></p>
              <p><span className="text-slate-400">Verified:</span> {child.fsmVerifiedAt ? formatDate(child.fsmVerifiedAt) : 'Not verified'}</p>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => openEdit(child)} className="btn-ghost text-xs"><Edit2 size={14} /> Edit</button>
              <button onClick={() => store.runFsmCheck(child.id)} className="btn-ghost text-xs text-primary-600"><Shield size={14} /> FSM Check</button>
              <button onClick={() => setDeleteTarget(child)} className="btn-ghost text-xs text-error-600 hover:bg-error-50"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editChild ? 'Edit Child' : 'Add Child'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Full Name</label><input className="input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required /></div>
          <div><label className="label">Date of Birth</label><input type="date" className="input" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
          <div><label className="label">School</label><select className="input" value={form.schoolId} onChange={e => setForm({ ...form, schoolId: e.target.value })}><option value="">— Select School —</option>{store.schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editChild ? 'Save' : 'Add Child'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && store.deleteChild(deleteTarget.id)}
        title="Delete Child" message={`Delete "${deleteTarget?.fullName}"? This will also remove all linked data.`} confirmLabel="Delete" danger />
    </div>
  );
}

export function ParentCarers() {
  const { store, myParents, myCarers, myChildren } = useParentData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editCarer, setEditCarer] = useState<Carer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Carer | null>(null);
  const [form, setForm] = useState({ fullName: '', relationship: '', phone: '', email: '', childId: '' });

  const openCreate = () => { setEditCarer(null); setForm({ fullName: '', relationship: '', phone: '', email: '', childId: '' }); setModalOpen(true); };
  const openEdit = (carer: Carer) => { setEditCarer(carer); setForm({ fullName: carer.fullName, relationship: carer.relationship, phone: carer.phone, email: carer.email, childId: carer.childId ?? '' }); setModalOpen(true); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parentId = myParents[0]?.id ?? '';
    if (!parentId) return;
    if (editCarer) {
      store.updateCarer(editCarer.id, { ...form, childId: form.childId || null });
    } else {
      store.createCarer({ parentId, ...form, childId: form.childId || null });
    }
    setModalOpen(false);
  };

  return (
    <div>
      <PageHeader title="Carers" subtitle="Manage authorised carers for your children"
        actions={<button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Carer</button>} />
      <div className="card">
        {myCarers.length === 0 ? (
          <EmptyState icon={<Users size={28} />} title="No carers" message="Add carers who are authorised to collect your children." />
        ) : (
          <Table headers={['Name', 'Relationship', 'Phone', 'Email', 'Linked Child', 'Actions']}>
            {myCarers.map(carer => (
              <tr key={carer.id} className="hover:bg-slate-50">
                <Td className="font-medium">{carer.fullName}</Td>
                <Td>{carer.relationship || '—'}</Td>
                <Td>{carer.phone || '—'}</Td>
                <Td>{carer.email || '—'}</Td>
                <Td>{myChildren.find(c => c.id === carer.childId)?.fullName ?? 'All children'}</Td>
                <Td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(carer)} className="p-1.5 rounded-lg text-slate-400 hover:bg-primary-50 hover:text-primary-600"><Edit2 size={16} /></button>
                    <button onClick={() => setDeleteTarget(carer)} className="p-1.5 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600"><Trash2 size={16} /></button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editCarer ? 'Edit Carer' : 'Add Carer'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Full Name</label><input className="input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required /></div>
          <div><label className="label">Relationship</label><input className="input" placeholder="Grandparent, Uncle, etc." value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div><label className="label">Linked Child (optional)</label><select className="input" value={form.childId} onChange={e => setForm({ ...form, childId: e.target.value })}><option value="">All children</option>{myChildren.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}</select></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editCarer ? 'Save' : 'Add Carer'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && store.deleteCarer(deleteTarget.id)}
        title="Delete Carer" message={`Delete "${deleteTarget?.fullName}"?`} confirmLabel="Delete" danger />
    </div>
  );
}

export function ParentActivities() {
  const { store, myChildren, myLinks } = useParentData();
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({ childId: '', clubId: '', activityId: '' });
  const [unlinkTarget, setUnlinkTarget] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  const visibleClubs = store.clubs.filter(c => c.isVisible);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkForm.childId || !linkForm.clubId || !linkForm.activityId) return;
    setLinkError(null);
    setLinking(true);
    const result = await store.createLink({ childId: linkForm.childId, clubId: linkForm.clubId, activityId: linkForm.activityId, status: 'active' });
    setLinking(false);
    if (result?.ok) {
      setLinkModalOpen(false);
      setLinkForm({ childId: '', clubId: '', activityId: '' });
    } else {
      const msg = (result?.data as any)?.message;
      setLinkError(msg ?? 'Booking failed. Please try again.');
    }
  };

  const availableActivities = store.activities.filter(a => a.clubId === linkForm.clubId);

  return (
    <div>
      <PageHeader title="Available Activities" subtitle="Browse activities and link your children to clubs"
        actions={<button onClick={() => { setLinkForm({ childId: myChildren[0]?.id ?? '', clubId: '', activityId: '' }); setLinkError(null); setLinkModalOpen(true); }} className="btn-primary"><Link2 size={16} /> Book Activity</button>} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-slate-900 mb-3">Available Clubs</h3>
          <div className="space-y-3">
            {visibleClubs.map(club => {
              const clubActivities = store.activities.filter(a => a.clubId === club.id);
              return (
                <div key={club.id} className="card p-4">
                  <h4 className="font-medium text-slate-900">{club.name}</h4>
                  <p className="text-sm text-slate-500 mt-1">{club.description}</p>
                  <p className="text-xs text-slate-400 mt-2">{club.contactEmail} · {club.phone}</p>
                  <div className="mt-3 space-y-2">
                    {clubActivities.map(act => (
                      <div key={act.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-sm">
                        <div>
                          <p className="font-medium text-slate-700">{act.title}</p>
                          <p className="text-xs text-slate-400">{formatDate(act.startDate)} — {formatDate(act.endDate)} · Ages {act.ageMin}-{act.ageMax}</p>
                        </div>
                        {(() => {
                          const booked = store.links.filter(l => l.activityId === act.id && l.status === 'active').length;
                          const remaining = act.capacity - booked;
                          return (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${remaining <= 0 ? 'bg-red-100 text-red-700' : remaining <= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                              {remaining <= 0 ? 'Full' : `${remaining} spots left`}
                            </span>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900 mb-3">My Bookings</h3>
          <div className="card">
            {myLinks.filter(l => l.status === 'active').length === 0 ? (
              <EmptyState icon={<Link2 size={28} />} title="No bookings" message="Book your children into activities to participate." />
            ) : (
              <Table headers={['Child', 'Club', 'Activity', 'Status', 'Actions']}>
                {myLinks.filter(l => l.status === 'active').map(link => {
                  const child = myChildren.find(c => c.id === link.childId);
                  const club = store.clubs.find(c => c.id === link.clubId);
                  const activity = store.activities.find(a => a.id === link.activityId);
                  return (
                    <tr key={link.id} className="hover:bg-slate-50">
                      <Td className="font-medium">{child?.fullName ?? '—'}</Td>
                      <Td>{club?.name ?? '—'}</Td>
                      <Td>{activity?.title ?? '—'}</Td>
                      <Td><StatusBadge status={link.status} /></Td>
                      <Td><button onClick={() => setUnlinkTarget(link.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600" title="Unlink"><Unlink size={16} /></button></Td>
                    </tr>
                  );
                })}
              </Table>
            )}
          </div>
        </div>
      </div>

      <Modal open={linkModalOpen} onClose={() => { setLinkModalOpen(false); setLinkError(null); }} title="Book Activity for Child">
        <form onSubmit={handleLink} className="space-y-4">
          <div><label className="label">Child</label><select className="input" value={linkForm.childId} onChange={e => setLinkForm({ ...linkForm, childId: e.target.value })} required>{myChildren.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}</select></div>
          <div><label className="label">Club</label><select className="input" value={linkForm.clubId} onChange={e => setLinkForm({ ...linkForm, clubId: e.target.value, activityId: '' })} required><option value="">— Select Club —</option>{visibleClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label">Activity</label><select className="input" value={linkForm.activityId} onChange={e => setLinkForm({ ...linkForm, activityId: e.target.value })} required><option value="">— Select Activity —</option>{availableActivities.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</select></div>
          {linkError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{linkError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setLinkModalOpen(false); setLinkError(null); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={linking} className="btn-primary">{linking ? 'Booking…' : 'Book Activity'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!unlinkTarget} onClose={() => setUnlinkTarget(null)}
        onConfirm={() => unlinkTarget && store.deleteLink(unlinkTarget)}
        title="Unlink Child" message="Unlink this child from the club? They will no longer be enrolled." confirmLabel="Unlink" danger />
    </div>
  );
}

export function ParentDeletionRequest() {
  const { store, auth } = useParentData();
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState('');

  const myRequests = store.deletionRequests.filter(d => d.parentId === auth.user?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.user) return;
    store.createDeletionRequest({ parentId: auth.user.id, parentName: auth.user.fullName, reason });
    setModalOpen(false);
    setReason('');
  };

  return (
    <div>
      <PageHeader title="Data Deletion Request" subtitle="Submit a request to have your data deleted"
        actions={<button onClick={() => setModalOpen(true)} className="btn-danger"><Trash2 size={16} /> Request Deletion</button>} />
      <div className="card p-5 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-error-50 flex items-center justify-center text-error-600 shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Your Right to Data Deletion</h3>
            <p className="text-sm text-slate-500 mt-1">You have the right to request deletion of your personal data and all associated records (children, carers, links, attendance). Your request will be reviewed by an administrator.</p>
          </div>
        </div>
      </div>
      <div className="card">
        {myRequests.length === 0 ? (
          <EmptyState icon={<FileText size={28} />} title="No requests" message="You have not submitted any deletion requests." />
        ) : (
          <Table headers={['Reason', 'Status', 'Requested', 'Processed']}>
            {myRequests.map(req => (
              <tr key={req.id} className="hover:bg-slate-50">
                <Td>{req.reason}</Td>
                <Td><StatusBadge status={req.status} /></Td>
                <Td>{formatDateTime(req.requestedAt)}</Td>
                <Td>{req.processedAt ? formatDateTime(req.processedAt) : '—'}</Td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Submit Deletion Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg bg-error-50 border border-error-200 p-3 text-sm text-error-700">
            This will submit a request to delete all your data including children, carers, and participation records. An admin will review and process your request.
          </div>
          <div><label className="label">Reason for Deletion</label><textarea className="input" rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="Please explain why you want your data deleted..." required /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-danger">Submit Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
