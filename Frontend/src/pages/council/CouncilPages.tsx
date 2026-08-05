import { useStore } from '../../lib/store';
import { PageHeader, StatCard, Table, Td, StatusBadge, EmptyState } from '../../components/ui';
import { exportToCsv, formatDate } from '../../lib/utils';
import { Users, Calendar, Building2, FileText, Download, TrendingUp, Activity as ActivityIcon, CheckCircle, XCircle } from 'lucide-react';

export function CouncilDashboard() {
  const store = useStore();
  const totalChildren = store.children.length;
  const fsmEligible = store.children.filter(c => c.fsmEligible).length;
  const totalAttendance = store.attendance.length;
  const presentCount = store.attendance.filter(a => a.status === 'present').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  return (
    <div>
      <PageHeader title="Council Dashboard" subtitle="Oversight and monitoring of HAF programme delivery" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Clubs" value={store.clubs.length} icon={<Building2 size={22} />} />
        <StatCard label="Total Children" value={totalChildren} icon={<Users size={22} />} color="accent" />
        <StatCard label="FSM Eligible" value={fsmEligible} icon={<CheckCircle size={22} />} color="warning" />
        <StatCard label="Attendance Rate" value={`${attendanceRate}%`} icon={<TrendingUp size={22} />} color="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Club Summary</h3>
          <div className="space-y-3">
            {store.clubs.map(club => {
              const clubActivities = store.activities.filter(a => a.clubId === club.id);
              const linkedChildren = store.links.filter(l => l.clubId === club.id && l.status === 'active').length;
              return (
                <div key={club.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{club.name}</p>
                    <p className="text-xs text-slate-400">{clubActivities.length} activities · {linkedChildren} children linked</p>
                  </div>
                  <StatusBadge status={club.isVisible ? 'active' : 'inactive'} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Attendance Overview</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg bg-accent-50">
              <CheckCircle className="mx-auto text-accent-600 mb-1" size={20} />
              <p className="text-xl font-bold text-slate-900">{presentCount}</p>
              <p className="text-xs text-slate-500">Present</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-error-50">
              <XCircle className="mx-auto text-error-600 mb-1" size={20} />
              <p className="text-xl font-bold text-slate-900">{store.attendance.filter(a => a.status === 'absent').length}</p>
              <p className="text-xs text-slate-500">Absent</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-warning-50">
              <Calendar className="mx-auto text-warning-600 mb-1" size={20} />
              <p className="text-xl font-bold text-slate-900">{store.attendance.filter(a => a.status === 'late').length}</p>
              <p className="text-xs text-slate-500">Late</p>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div className="bg-accent-500 h-full rounded-full" style={{ width: `${attendanceRate}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">{attendanceRate}% overall attendance rate</p>
        </div>
      </div>
    </div>
  );
}

export function CouncilMonitoring() {
  const store = useStore();

  return (
    <div>
      <PageHeader title="Monitoring Views" subtitle="Detailed oversight of clubs, activities, and participation" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">HAF Cycles Status</h3>
          <Table headers={['Cycle', 'Period', 'Status']}>
            {store.cycles.map(cycle => (
              <tr key={cycle.id} className="hover:bg-slate-50">
                <Td className="font-medium">{cycle.name}</Td>
                <Td>{formatDate(cycle.startDate)} — {formatDate(cycle.endDate)}</Td>
                <Td><StatusBadge status={cycle.status} /></Td>
              </tr>
            ))}
          </Table>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">FSM Verification Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-accent-50 border border-accent-100">
              <p className="text-2xl font-bold text-accent-700">{store.children.filter(c => c.fsmEligible).length}</p>
              <p className="text-sm text-slate-600">Eligible Children</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-2xl font-bold text-slate-700">{store.children.filter(c => !c.fsmEligible).length}</p>
              <p className="text-sm text-slate-600">Not Eligible</p>
            </div>
            <div className="p-4 rounded-lg bg-primary-50 border border-primary-100">
              <p className="text-2xl font-bold text-primary-700">{store.fsmChecks.length}</p>
              <p className="text-sm text-slate-600">Total Checks Run</p>
            </div>
            <div className="p-4 rounded-lg bg-warning-50 border border-warning-100">
              <p className="text-2xl font-bold text-warning-700">{store.children.filter(c => !c.fsmVerifiedAt).length}</p>
              <p className="text-sm text-slate-600">Pending Verification</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Activity Participation by Club</h3>
        {store.activities.length === 0 ? (
          <EmptyState icon={<ActivityIcon size={28} />} title="No activities" message="No activities have been created yet." />
        ) : (
          <Table headers={['Activity', 'Club', 'Cycle', 'Capacity', 'Linked Children', 'Age Range']}>
            {store.activities.map(activity => {
              const club = store.clubs.find(c => c.id === activity.clubId);
              const cycle = store.cycles.find(c => c.id === activity.cycleId);
              const linkedCount = store.links.filter(l => l.activityId === activity.id && l.status === 'active').length;
              return (
                <tr key={activity.id} className="hover:bg-slate-50">
                  <Td className="font-medium">{activity.title}</Td>
                  <Td>{club?.name ?? '—'}</Td>
                  <Td>{cycle?.name ?? '—'}</Td>
                  <Td>{activity.capacity}</Td>
                  <Td>{linkedCount}</Td>
                  <Td>{activity.ageMin}–{activity.ageMax}</Td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>
    </div>
  );
}

export function CouncilReports() {
  const store = useStore();

  const reports = [
    {
      label: 'Cumulative Attendance Report',
      icon: CheckCircle,
      desc: 'All attendance records across all clubs and activities',
      action: () => exportToCsv('cumulative-attendance-report', store.attendance.map(a => ({
        Child: store.children.find(c => c.id === a.childId)?.fullName ?? '',
        Activity: store.activities.find(act => act.id === a.activityId)?.title ?? '',
        Club: store.clubs.find(cl => cl.id === store.activities.find(act => act.id === a.activityId)?.clubId)?.name ?? '',
        Date: a.date, Status: a.status, Notes: a.notes, RecordedBy: store.users.find(u => u.id === a.recordedBy)?.fullName ?? '',
      }))),
    },
    {
      label: 'Cumulative Activity Report',
      icon: ActivityIcon,
      desc: 'All activities with participation counts and capacity',
      action: () => exportToCsv('cumulative-activity-report', store.activities.map(a => {
        const club = store.clubs.find(c => c.id === a.clubId);
        const cycle = store.cycles.find(c => c.id === a.cycleId);
        const linked = store.links.filter(l => l.activityId === a.id && l.status === 'active').length;
        return { Title: a.title, Club: club?.name ?? '', Cycle: cycle?.name ?? '', StartDate: a.startDate, EndDate: a.endDate, StartTime: a.startTime, EndTime: a.endTime, Capacity: a.capacity, Enrolled: linked, Location: a.location, AgeRange: `${a.ageMin}-${a.ageMax}` };
      })),
    },
    {
      label: 'Cumulative Club Report',
      icon: Building2,
      desc: 'Summary of each club with activities and participation',
      action: () => exportToCsv('cumulative-club-report', store.clubs.map(c => {
        const activities = store.activities.filter(a => a.clubId === c.id);
        const children = store.links.filter(l => l.clubId === c.id && l.status === 'active').length;
        return { Club: c.name, Email: c.contactEmail, Phone: c.phone, Address: c.address, Visible: c.isVisible ? 'Yes' : 'No', Activities: activities.length, ChildrenLinked: children, Created: formatDate(c.createdAt) };
      })),
    },
    {
      label: 'Data System Report',
      icon: FileText,
      desc: 'System-wide data inventory and statistics',
      action: () => exportToCsv('data-system-report', [
        { Metric: 'Total Users', Value: store.users.length },
        { Metric: 'Active Users', Value: store.users.filter(u => u.isActive).length },
        { Metric: 'Admin Users', Value: store.users.filter(u => u.role === 'admin').length },
        { Metric: 'Council Users', Value: store.users.filter(u => u.role === 'council').length },
        { Metric: 'Club Users', Value: store.users.filter(u => u.role === 'club').length },
        { Metric: 'Parent Users', Value: store.users.filter(u => u.role === 'parent').length },
        { Metric: 'Total Clubs', Value: store.clubs.length },
        { Metric: 'Visible Clubs', Value: store.clubs.filter(c => c.isVisible).length },
        { Metric: 'Total Activities', Value: store.activities.length },
        { Metric: 'Total Parents', Value: store.parents.length },
        { Metric: 'Total Children', Value: store.children.length },
        { Metric: 'FSM Eligible', Value: store.children.filter(c => c.fsmEligible).length },
        { Metric: 'Total Carers', Value: store.carers.length },
        { Metric: 'Total Links', Value: store.links.length },
        { Metric: 'Total Attendance', Value: store.attendance.length },
        { Metric: 'HAF Cycles', Value: store.cycles.length },
        { Metric: 'Schools', Value: store.schools.length },
        { Metric: 'FSM Checks', Value: store.fsmChecks.length },
        { Metric: 'Deletion Requests', Value: store.deletionRequests.length },
      ]),
    },
    {
      label: 'Summary Oversight View',
      icon: TrendingUp,
      desc: 'High-level summary for council oversight',
      action: () => exportToCsv('summary-oversight', store.clubs.map(c => {
        const activities = store.activities.filter(a => a.clubId === c.id);
        const childIds = store.links.filter(l => l.clubId === c.id).map(l => l.childId);
        const attendance = store.attendance.filter(a => activities.some(act => act.id === a.activityId));
        const present = attendance.filter(a => a.status === 'present').length;
        return {
          Club: c.name, Activities: activities.length, ChildrenEnrolled: childIds.length,
          AttendanceRecords: attendance.length, Present: present,
          Absent: attendance.filter(a => a.status === 'absent').length,
          Late: attendance.filter(a => a.status === 'late').length,
          AttendanceRate: attendance.length > 0 ? `${Math.round((present / attendance.length) * 100)}%` : 'N/A',
        };
      })),
    },
    {
      label: 'Annual Report',
      icon: FileText,
      desc: 'Facilitate production of the Annual Report',
      action: () => exportToCsv('annual-report-council', [
        { Section: 'Programme Overview', Metric: 'Total Clubs', Value: store.clubs.length },
        { Section: 'Programme Overview', Metric: 'Total Activities', Value: store.activities.length },
        { Section: 'Programme Overview', Metric: 'HAF Cycles Run', Value: store.cycles.filter(c => c.status === 'closed' || c.status === 'active').length },
        { Section: 'Participation', Metric: 'Total Children', Value: store.children.length },
        { Section: 'Participation', Metric: 'FSM Eligible Children', Value: store.children.filter(c => c.fsmEligible).length },
        { Section: 'Participation', Metric: 'Total Parents', Value: store.parents.length },
        { Section: 'Attendance', Metric: 'Total Records', Value: store.attendance.length },
        { Section: 'Attendance', Metric: 'Present', Value: store.attendance.filter(a => a.status === 'present').length },
        { Section: 'Attendance', Metric: 'Absent', Value: store.attendance.filter(a => a.status === 'absent').length },
        { Section: 'Attendance', Metric: 'Late', Value: store.attendance.filter(a => a.status === 'late').length },
        { Section: 'Schools', Metric: 'Participating Schools', Value: store.schools.length },
        { Section: 'Data Governance', Metric: 'Deletion Requests', Value: store.deletionRequests.length },
        { Section: 'Data Governance', Metric: 'Processed', Value: store.deletionRequests.filter(d => d.status === 'processed').length },
      ]),
    },
  ];

  return (
    <div>
      <PageHeader title="Oversight Reports" subtitle="Downloadable cumulative reports for council oversight" />
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
