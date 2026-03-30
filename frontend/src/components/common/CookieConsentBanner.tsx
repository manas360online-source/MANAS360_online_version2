import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';

const COOKIE_CONSENT_KEY = 'cookie_tracking_consent';

type ConsentChoice = 'accepted' | 'rejected';

export default function CookieConsentBanner() {
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  useEffect(() => {
    try {
      const existingConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
      setIsBannerVisible(existingConsent !== 'accepted' && existingConsent !== 'rejected');
    } catch {
      setIsBannerVisible(true);
    }
  }, []);

  const handleConsent = (choice: ConsentChoice) => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    } catch {
      // If storage is unavailable, still dismiss for this session render.
    }
    setIsBannerVisible(false);
  };

  if (!isBannerVisible) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+52px)] z-[90] border-t border-calm-sage/30 bg-white/95 px-4 py-4 shadow-soft-2xl backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-wellness-text">
            We use cookies to improve your experience. Learn more in our{' '}
            <button
              type="button"
              onClick={() => setIsPolicyModalOpen(true)}
              className="font-semibold text-calm-sage underline underline-offset-2 hover:text-wellness-text"
            >
              Cookie Policy
            </button>
            .
          </p>

          <div className="flex w-full gap-2 md:w-auto">
            <button
              type="button"
              onClick={() => handleConsent('accepted')}
              className="rounded-xl bg-calm-sage px-4 py-2 text-sm font-medium text-white transition-smooth hover:bg-calm-sage/90"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => handleConsent('rejected')}
              className="rounded-xl border border-calm-sage/40 bg-white px-4 py-2 text-sm font-medium text-wellness-text transition-smooth hover:bg-calm-sage/10"
            >
              Reject
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        title="Cookie & Tracking Policy"
        size="xl"
      >
        <div className="h-[70vh] overflow-hidden rounded-2xl border border-calm-sage/20 bg-white">
          <iframe
            title="Cookie Policy"
            src="/legal/cookie.html"
            className="h-full w-full"
          />
        </div>
      </Modal>
    </>
  );
}