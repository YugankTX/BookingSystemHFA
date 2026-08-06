export type Service =
  | 'identity' | 'program' | 'club' | 'family'
  | 'booking' | 'attendance' | 'eligibility' | 'compliance' | 'reporting' | 'notification';

const URLS: Record<Service, string> = {
  identity:     ((import.meta.env.VITE_IDENTITY_URL     as string | undefined) ?? 'http://localhost:5001').replace(/\/$/, ''),
  program:      ((import.meta.env.VITE_PROGRAM_URL      as string | undefined) ?? 'http://localhost:5002').replace(/\/$/, ''),
  club:         ((import.meta.env.VITE_CLUB_URL         as string | undefined) ?? 'http://localhost:5003').replace(/\/$/, ''),
  family:       ((import.meta.env.VITE_FAMILY_URL       as string | undefined) ?? 'http://localhost:5004').replace(/\/$/, ''),
  booking:      ((import.meta.env.VITE_BOOKING_URL      as string | undefined) ?? 'http://localhost:5005').replace(/\/$/, ''),
  attendance:   ((import.meta.env.VITE_ATTENDANCE_URL   as string | undefined) ?? 'http://localhost:5006').replace(/\/$/, ''),
  eligibility:  ((import.meta.env.VITE_ELIGIBILITY_URL  as string | undefined) ?? 'http://localhost:5007').replace(/\/$/, ''),
  compliance:   ((import.meta.env.VITE_COMPLIANCE_URL   as string | undefined) ?? 'http://localhost:5008').replace(/\/$/, ''),
  reporting:    ((import.meta.env.VITE_REPORTING_URL    as string | undefined) ?? 'http://localhost:5009').replace(/\/$/, ''),
  notification: ((import.meta.env.VITE_NOTIFICATION_URL as string | undefined) ?? 'http://localhost:5010').replace(/\/$/, ''),
};

// auth.tsx uses apiBaseUrl directly — keep pointing to identity service
export const apiBaseUrl = URLS.identity;

async function request<T>(baseUrl: string, path: string, options: RequestInit = {}, token?: string) {
  const tok = token ?? localStorage.getItem('haf_auth_token') ?? undefined;
  const headers = new Headers(options.headers);
  if (tok && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${tok}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json');
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const text = await response.text();
  let data: T | null = null;
  if (text) {
    try { data = JSON.parse(text) as T; } catch { data = text as unknown as T; }
  }
  return { ok: response.ok, status: response.status, data };
}

// Kept for auth.tsx backward compat — always routes to identity service
export function apiRequest<T>(path: string, options: RequestInit = {}, token?: string) {
  return request<T>(URLS.identity, path, options, token);
}

// Service-aware request helper — auto-reads token from localStorage
export function svcReq<T>(service: Service, path: string, options: RequestInit = {}, token?: string) {
  return request<T>(URLS[service], path, options, token);
}
