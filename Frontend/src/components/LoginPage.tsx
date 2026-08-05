import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { Role } from '../lib/types';
import {
  Shield, Building2, Users, Heart, Mail, Lock,
  User as UserIcon, Phone, ArrowRight, ArrowLeft,
  KeyRound, RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff,
} from 'lucide-react';

const roleOptions: { value: Role; label: string; icon: typeof Shield; desc: string; color: string }[] = [
  { value: 'parent',  label: 'Parent / Guardian',   icon: Heart,      desc: 'Manage your children & activities', color: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'club',    label: 'Club / Operator',      icon: Users,      desc: 'Run activities & track attendance',  color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 'council', label: 'Council Management',   icon: Building2,  desc: 'Oversight and reporting',            color: 'border-blue-300 bg-blue-50 text-blue-700' },
  { value: 'admin',   label: 'System Administrator', icon: Shield,     desc: 'Full system governance',             color: 'border-purple-300 bg-purple-50 text-purple-700' },
];

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('parent');
  const [eligibilityConsent, setEligibilityConsent] = useState(false);
  const [error, setError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await auth.login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
    } else {
      navigate(`/${result.user.role}/dashboard`, { replace: true });
    }
  };

  const handleSignupRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password || !fullName) { setError('Full name, email and password are required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!eligibilityConsent) { setError('You must confirm eligibility consent to proceed.'); return; }
    const code = auth.requestOtp(email, fullName, role, phone, password);
    setInfo(`OTP sent to ${email}. Demo code: ${code}`);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await auth.verifyOtp(otpCode);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
    } else {
      navigate(`/${result.user.role}/dashboard`, { replace: true });
    }
  };

  const handleResend = () => {
    const code = auth.resendOtp();
    if (code) { setInfo(`New OTP sent. Demo code: ${code}`); setError(''); }
  };

  // Demo email map — matches seeded users in the backend
  const demoEmails: Record<Role, string> = {
    admin: 'admin@haf.gov.uk', council: 'council@haf.gov.uk',
    club: 'club@haf.gov.uk',   parent: 'parent@haf.gov.uk',
  };

  const handleQuickLogin = async (r: Role) => {
    setError('');
    setLoading(true);
    const result = await auth.login(demoEmails[r], 'demo123');
    setLoading(false);
    if (result.ok) {
      navigate(`/${result.user.role}/dashboard`, { replace: true });
    } else {
      setError(result.error);
    }
  };

  // OTP verification screen
  if (auth.otpPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-950">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-4">
              <Heart size={14} className="text-primary-400" />
              Bradford HAF Platform
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 animate-scale-in">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 mb-5 mx-auto">
              <KeyRound size={26} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 text-center">Verify your email</h1>
            <p className="text-sm text-slate-500 mt-2 mb-6 text-center">
              Enter the 6-digit code sent to{' '}
              <span className="font-semibold text-slate-700">{auth.otpPending}</span>
            </p>

            {info && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-primary-50 border border-primary-200 px-3 py-2.5 text-sm text-primary-700">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                {info}
              </div>
            )}
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-error-50 border border-error-200 px-3 py-2.5 text-sm text-error-700">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="input text-center text-3xl tracking-[0.6em] font-bold py-4"
                autoFocus
                autoComplete="one-time-code"
                aria-label="One-time password"
              />
              <button type="submit" disabled={loading || otpCode.length < 6} className="btn-primary w-full py-3">
                {loading ? 'Verifying…' : 'Verify & Create Account'}
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={() => { auth.clearOtp(); setInfo(''); setError(''); }}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 font-medium"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                onClick={handleResend}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1.5 font-medium"
              >
                <RefreshCw size={14} /> Resend code
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-primary-950">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-10 xl:p-14">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <Heart size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">Bradford HAF</p>
              <p className="text-slate-400 text-xs">Holiday Activities & Food</p>
            </div>
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4">
            Supporting children<br />
            <span className="text-primary-400">through the holidays</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            The City of Bradford Metropolitan District Council's platform for managing
            the DfE-funded Holiday Activity &amp; Food programme.
          </p>
        </div>
        <div className="space-y-4">
          {[
            { icon: Shield, text: 'Secure, role-based access' },
            { icon: CheckCircle2, text: 'FSM eligibility verification' },
            { icon: Users, text: 'Manage clubs, activities & children' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-3 text-sm text-slate-400">
              <item.icon size={16} className="text-primary-400 shrink-0" />
              {item.text}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <Heart size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold">Bradford HAF</p>
              <p className="text-slate-400 text-xs">Holiday Activities & Food</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            {/* Tab switcher */}
            <div className="flex border-b border-slate-100">
              {(['login', 'signup'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setInfo(''); }}
                  className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === m ? 'text-primary-700 border-b-2 border-primary-600 bg-primary-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {m === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <div className="p-6 sm:p-8">
              {error && (
                <div className="mb-5 flex items-start gap-2 rounded-lg bg-error-50 border border-error-200 px-3 py-2.5 text-sm text-error-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {mode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4" noValidate>
                  <div>
                    <label htmlFor="login-email" className="label">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
                      <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="input pl-10"
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="login-password" className="label">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="input pl-10 pr-10"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
                    {loading ? 'Signing in…' : 'Sign in'}
                    <ArrowRight size={16} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignupRequest} className="space-y-4" noValidate>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label htmlFor="signup-name" className="label label-required">Full name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input id="signup-name" type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="input pl-10" placeholder="Jane Doe" autoComplete="name" required />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="signup-email" className="label label-required">Email address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="input pl-10" placeholder="you@example.com" autoComplete="email" required />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="signup-phone" className="label">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input id="signup-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input pl-10" placeholder="07700 900000" autoComplete="tel" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="signup-password" className="label label-required">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input id="signup-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input pl-10" placeholder="8+ characters" autoComplete="new-password" required />
                      </div>
                    </div>
                  </div>

                  <fieldset>
                    <legend className="label mb-2">Account type</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {roleOptions.map(opt => {
                        const Icon = opt.icon;
                        const selected = role === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setRole(opt.value)}
                            aria-pressed={selected}
                            className={`flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-all ${selected ? opt.color + ' ring-2 ring-offset-1 ring-primary-400' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                          >
                            <Icon size={16} className={selected ? '' : 'text-slate-400'} />
                            <span className="text-xs font-semibold">{opt.label}</span>
                            <span className="text-[10px] opacity-70 leading-tight">{opt.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* Eligibility consent — required by spec */}
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={eligibilityConsent}
                        onChange={e => setEligibilityConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 shrink-0"
                        required
                        aria-required="true"
                      />
                      <div>
                        <p className="text-xs font-semibold text-amber-800 mb-1">Eligibility consent & disclaimer</p>
                        <p className="text-[11px] text-amber-700 leading-relaxed">
                          I confirm that I consent to Bradford Council and programme providers
                          conducting eligibility checks (including FSM verification) to ensure
                          the HAF programme reaches its intended recipients. I understand my
                          data will be processed in accordance with the UK GDPR.
                        </p>
                      </div>
                    </label>
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                    {loading ? 'Sending…' : 'Send verification code'}
                    <ArrowRight size={16} />
                  </button>
                </form>
              )}

              {/* Quick demo logins */}
              {mode === 'login' && (
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <p className="text-xs text-slate-400 text-center mb-3 font-medium">Quick demo access</p>
                  <div className="grid grid-cols-2 gap-2">
                    {roleOptions.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleQuickLogin(opt.value)}
                          disabled={loading}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
                        >
                          <Icon size={13} className="text-slate-400 shrink-0" />
                          {opt.label.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-6">
            Need assistance? Call{' '}
            <a href="tel:01274431000" className="text-primary-400 hover:text-primary-300 font-medium">
              01274 431000
            </a>{' '}
            or email{' '}
            <a href="mailto:haf@bradford.gov.uk" className="text-primary-400 hover:text-primary-300 font-medium">
              haf@bradford.gov.uk
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
