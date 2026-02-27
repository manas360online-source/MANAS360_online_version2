import { useEffect, useState } from 'react';

/**
 * CrisisBanner component
 * Fixed footer with crisis helpline information
 * Non-intrusive but always accessible
 */
export const CrisisBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  const crisisNumber = '1800-599-0019';
  const teleManasUrl = `tel:${crisisNumber}`;

  useEffect(() => {
    // Ensure crisis banner stays visible
    const handleScroll = () => {
      setIsVisible(true);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-gradient-coral text-white p-4 text-center z-50 transition-opacity duration-300 safe-pb ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      role="region"
      aria-label="Crisis support information"
      aria-live="polite"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        {/* Crisis Icon and Text */}
        <span className="text-sm md:text-base font-medium whitespace-nowrap">
          🚨 In crisis? Need immediate help?
        </span>

        {/* Helpline Link */}
        <a
          href={teleManasUrl}
          className="text-white font-semibold underline hover:opacity-90 transition-opacity whitespace-nowrap focus-ring rounded px-2"
          aria-label={`Call Tele-MANAS crisis helpline at ${crisisNumber}`}
        >
          Call Tele-MANAS: {crisisNumber}
        </a>
      </div>
    </div>
  );
};

export default CrisisBanner;
