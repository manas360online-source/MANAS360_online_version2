import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

/**
 * CtaSection component
 * Final call-to-action section at the bottom
 */
export const CtaSection: React.FC = () => {
  const navigate = useNavigate();
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    setHasAnimated(true);
  }, []);

  const handleStartAssessment = () => {
    // Smooth fade out effect
    document.body.style.transition = 'opacity 0.5s ease';
    document.body.style.opacity = '0';

    setTimeout(() => {
      navigate('/assessment');
      document.body.style.opacity = '1';
    }, 500);
  };

  return (
    <section
      className={`py-20 md:py-32 px-4 text-center relative z-10 mb-20 ${
        hasAnimated ? 'animate-fade-in-up' : ''
      }`}
      aria-labelledby="final-cta-title"
    >
      {/* Final Headline */}
      <h2
        id="final-cta-title"
        className="font-serif font-light text-3xl md:text-4xl lg:text-5xl text-charcoal mb-12"
      >
        Ready to feel <span className="font-semibold text-gradient">better</span>
        ?
      </h2>

      {/* Final CTA Button */}
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={handleStartAssessment}
          className="bg-gradient-calm hover:shadow-soft-xl hover:-translate-y-1 text-white font-sans font-medium text-lg px-12 py-5 rounded-full transition-smooth whitespace-nowrap shadow-soft-lg focus-ring"
          aria-label="Take the 60-second mental health assessment"
        >
          Take the 60-Second Check
        </button>
      </div>
    </section>
  );
};

export default CtaSection;
