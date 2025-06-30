import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function ScrollToTopButton({ scrollContainerRef }: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      setIsVisible(scrollTop > 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);

  const scrollToTop = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label="Scroll to top"
    >
      <ChevronUp size={20} />
    </button>
  );
}