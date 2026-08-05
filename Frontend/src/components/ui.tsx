import { type ReactNode } from 'react';
import { Loader2, TrendingUp } from 'lucide-react';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>
      )}
    </div>
  );
}

export function StatCard({
  label, value, icon, trend, color = 'primary',
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  color?: 'primary' | 'accent' | 'warning' | 'error';
}) {
  const palettes = {
    primary: { bg: 'bg-primary-50', icon: 'text-primary-600', border: 'border-primary-200', bar: 'bg-primary-600' },
    accent:  { bg: 'bg-accent-50',  icon: 'text-accent-600',  border: 'border-accent-200',  bar: 'bg-accent-600' },
    warning: { bg: 'bg-warning-50', icon: 'text-warning-600', border: 'border-warning-200', bar: 'bg-warning-500' },
    error:   { bg: 'bg-error-50',   icon: 'text-error-600',   border: 'border-error-200',   bar: 'bg-error-600' },
  };
  const p = palettes[color];

  return (
    <div className={`card overflow-hidden animate-slide-up`}>
      <div className={`h-1 ${p.bar}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{value}</p>
            {trend && (
              <p className="flex items-center gap-1 text-xs text-slate-400 mt-2">
                <TrendingUp size={12} /> {trend}
              </p>
            )}
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${p.bg} ${p.icon} border ${p.border}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, message, action }: { icon: ReactNode; title: string; message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs leading-relaxed">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
      <Loader2 className="animate-spin" size={20} />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="table-container">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {headers.map(h => (
              <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-slate-700 ${className ?? ''}`}>{children}</td>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:       'badge-success',
    present:      'badge-success',
    eligible:     'badge-success',
    processed:    'badge-success',
    confirmed:    'badge-success',
    draft:        'badge-neutral',
    inactive:     'badge-neutral',
    not_eligible: 'badge-error',
    absent:       'badge-error',
    closed:       'badge-error',
    rejected:     'badge-error',
    cancelled:    'badge-error',
    pending:      'badge-warning',
    late:         'badge-warning',
  };
  const cls = map[status] ?? 'badge-neutral';
  return <span className={cls}>{status.replace(/_/g, ' ')}</span>;
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    admin: 'badge-error', council: 'badge-info', club: 'badge-success', parent: 'badge-warning',
  };
  return <span className={map[role] ?? 'badge-neutral'}>{role}</span>;
}

export function SectionCard({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="card">
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
