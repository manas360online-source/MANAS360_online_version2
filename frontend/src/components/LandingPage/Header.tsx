import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

/**
 * Header component
 * Navigation header with MANAS360 branding
 */
export const Header: React.FC = () => {
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    setHasAnimated(true);
  }, []);

  return (
    <header
      className={`relative z-10 py-6 md:py-8 px-4 text-center ${
        hasAnimated ? 'animate-fade-in-down' : ''
      }`}
      role="banner"
    >
      <Link
        to="/"
        className="inline-block focus-ring rounded-lg px-4 py-2"
        aria-label="MANAS360 home"
      >
        <div className="font-serif font-light text-2xl md:text-3xl text-charcoal tracking-wider">
          MANS<span className="font-semibold">360</span>
        </div>
      </Link>
    </header>
  );
};

export default Header;
