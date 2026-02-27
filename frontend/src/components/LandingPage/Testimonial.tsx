import { useEffect, useRef } from 'react';

interface TestimonialProps {
  quote?: string;
  author?: string;
  location?: string;
}

/**
 * Testimonial component
 * Displays user testimonial and social proof
 */
export const Testimonial: React.FC<TestimonialProps> = ({
  quote = 'I was so confused about what I was feeling. MANAS360 helped me understand it was anxiety, not weakness. My therapist has been incredible.',
  author = 'Priya',
  location = 'Bangalore',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && cardRef.current) {
          cardRef.current.classList.add('animate-fade-in');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  return (
    <section
      className="py-20 md:py-32 px-4 glass-light mx-4 md:mx-auto rounded-3xl relative z-10"
      aria-labelledby="testimonial-quote"
    >
      <div
        ref={cardRef}
        className="glass max-w-2xl mx-auto p-10 md:p-16 rounded-3xl text-center opacity-0"
      >
        {/* Quote Mark */}
        <div
          className="text-6xl md:text-7xl text-calm-sage/30 mb-4"
          aria-hidden="true"
        >
          "
        </div>

        {/* Testimonial Quote */}
        <p
          id="testimonial-quote"
          className="font-serif font-light text-2xl md:text-3xl text-charcoal italic mb-8 leading-relaxed"
        >
          {quote}
        </p>

        {/* Author Info */}
        <footer className="text-charcoal opacity-70">
          <p className="text-base md:text-lg">
            — {author}, {location}
          </p>
        </footer>
      </div>
    </section>
  );
};

export default Testimonial;
