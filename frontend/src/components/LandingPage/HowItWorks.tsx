import { useEffect, useRef } from 'react';

interface Step {
  number: number;
  title: string;
  description: string;
}

/**
 * HowItWorks component
 * Explains the three-step process to users
 */
export const HowItWorks: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  const steps: Step[] = [
    {
      number: 1,
      title: 'Tell Us How You Feel',
      description:
        'Answer 3 simple questions about what you\'re experiencing. It takes just 60 seconds. No medical jargon.',
    },
    {
      number: 2,
      title: 'Get Clarity',
      description:
        'We\'ll help you understand what you\'re going through. Depression? Anxiety? Something else? We\'ll figure it out together.',
    },
    {
      number: 3,
      title: 'Connect with Help',
      description:
        'We\'ll match you with a therapist who specializes in exactly what you need. Book your first session at ₹500.',
    },
  ];

  useEffect(() => {
    // Intersection observer for lazy animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    stepsRef.current.forEach((step) => {
      if (step) observer.observe(step);
    });

    return () => {
      stepsRef.current.forEach((step) => {
        if (step) observer.unobserve(step);
      });
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="py-20 md:py-32 px-4 relative z-10"
      aria-labelledby="how-it-works-title"
    >
      {/* Section Title */}
      <h2
        id="how-it-works-title"
        className="font-serif font-light text-3xl md:text-4xl lg:text-5xl text-charcoal text-center mb-16 md:mb-24 animate-fade-in-down"
      >
        Here's What Happens Next
      </h2>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-5xl mx-auto">
        {steps.map((step, index) => (
          <div
            key={step.number}
            ref={(el) => {
              stepsRef.current[index] = el;
            }}
            className="glass p-8 md:p-10 rounded-3xl hover:shadow-soft-sm hover:-translate-y-2 transition-smooth opacity-0"
            style={{
              animationDelay: `${index * 0.2}s`,
            }}
          >
            {/* Step Number Circle */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-calm rounded-full flex items-center justify-center text-white font-semibold text-xl md:text-2xl shadow-soft-lg">
                {step.number}
              </div>
            </div>

            {/* Step Title */}
            <h3 className="text-lg md:text-xl font-semibold text-charcoal text-center mb-4">
              {step.title}
            </h3>

            {/* Step Description */}
            <p className="text-base text-charcoal opacity-80 text-center leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
