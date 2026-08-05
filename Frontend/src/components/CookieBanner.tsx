import { useState, useEffect } from 'react';
import { Cookie, X, ShieldCheck } from 'lucide-react';

const COOKIE_KEY = 'haf_cookie_consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up"
    >
      <div className="max-w-4xl mx-auto bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary-600/30 flex items-center justify-center shrink-0 mt-0.5">
            <Cookie size={20} className="text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={14} className="text-primary-400" />
              <h2 className="text-sm font-semibold text-white">Bradford HAF — Cookie Notice</h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              This service uses essential cookies to maintain your session and keep you signed in securely.
              We do not use tracking or advertising cookies. By continuing, you consent to our use of
              strictly necessary cookies in accordance with the{' '}
              <a
                href="https://ico.org.uk/for-organisations/guide-to-pecr/cookies-and-similar-technologies/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 underline hover:text-primary-300 focus-visible:outline-primary-400"
              >
                UK PECR regulations
              </a>
              .
            </p>
          </div>
          <button
            onClick={decline}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Dismiss cookie notice"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center gap-3 mt-4 pl-14">
          <button onClick={accept} className="btn-primary text-xs px-4 py-1.5">
            Accept essential cookies
          </button>
          <button onClick={decline} className="btn text-xs px-4 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600">
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
