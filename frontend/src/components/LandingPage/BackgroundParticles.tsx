import { useEffect, useRef } from 'react';

/**
 * Particle component for background animation
 * Creates floating particles like settling thoughts
 */
const Particle: React.FC<{ index: number }> = ({ index }) => {
  const positions = [
    { left: '10%', top: '20%', delay: '0s' },
    { left: '30%', top: '40%', delay: '2s' },
    { left: '50%', top: '15%', delay: '4s' },
    { left: '70%', top: '35%', delay: '1s' },
    { left: '85%', top: '25%', delay: '3s' },
    { left: '20%', top: '60%', delay: '5s' },
    { left: '60%', top: '70%', delay: '2.5s' },
    { left: '80%', top: '55%', delay: '4.5s' },
  ];

  const position = positions[index % positions.length];

  return (
    <div
      className="absolute w-1 h-1 bg-calm-sage rounded-full opacity-20 animate-float pointer-events-none"
      style={{
        left: position.left,
        top: position.top,
        animationDelay: position.delay,
      }}
      aria-hidden="true"
    />
  );
};

/**
 * BackgroundParticles component
 * Manages all floating particles in the background
 */
export const BackgroundParticles: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Intersection observer for performance optimization
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (containerRef.current) {
          // Pause animations when not visible
          containerRef.current.style.animationPlayState = entry.isIntersecting
            ? 'running'
            : 'paused';
        }
      },
      { threshold: 0 }
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
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <Particle key={i} index={i} />
      ))}
    </div>
  );
};

export default BackgroundParticles;
