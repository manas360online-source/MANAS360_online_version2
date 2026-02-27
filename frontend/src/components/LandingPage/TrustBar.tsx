import { useEffect, useRef } from 'react';

interface TrustItem {
  icon: string;
  title: string;
  description: string;
}

/**
 * TrustBar component
 * Shows trust indicators and confidence builders
 */
export const TrustBar: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const trustItems: TrustItem[] = [
    {
      icon: '🔒',
      title: '100%',
      description: 'Confidential',
    },
    {
      icon: '🧘',
      title: 'Licensed',
      description: 'Therapists',
    },
    {
      icon: '💙',
      title: 'No',
      description: 'Judgment',
    },
    {
      icon: '⚡',
      title: '60 Second',
      description: 'Check',
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && containerRef.current) {
          containerRef.current.classList.add('animate-fade-in');
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="glass grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 mt-16 md:mt-20 p-6 md:p-8 max-w-4xl mx-auto relative z-10"
      role="region"
      aria-label="Trust indicators"
    >
      {trustItems.map((item, index) => (
        <div
          key={index}
          className="flex flex-col items-center gap-3 text-center"
          style={{
            animationDelay: `${index * 0.1}s`,
          }}
        >
          {/* Trust Icon */}
          <div className="text-3xl md:text-4xl" aria-hidden="true">
            {item.icon}
          </div>

          {/* Trust Text */}
          <div className="text-charcoal">
            <div className="font-semibold text-sm md:text-base">{item.title}</div>
            <div className="text-xs md:text-sm opacity-75">{item.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrustBar;
