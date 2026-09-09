import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// ResultsCarousel — dependency-free scroll-snap slider.
// - Responsive: 4 / 3 / 2 / 1 card(s) per viewport
// - Prev/next arrows, keyboard arrows, native swipe, pagination dots
// ---------------------------------------------------------------------------

interface ResultsCarouselProps<T extends { id?: string }> {
  items: T[];
  cardClassName: string;
  renderCard: (item: T, idx: number) => React.ReactNode;
  ariaLabel?: string;
  emptyFallback?: React.ReactNode;
}

export const ResultsCarousel = <T extends { id?: string }>({
  items,
  cardClassName,
  renderCard,
  ariaLabel = 'Natijalar karvuseli',
  emptyFallback,
}: ResultsCarouselProps<T>) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [totalPages, setTotalPages] = useState(Math.max(1, items.length));

  const visibleCount = () => {
    const w = trackRef.current?.clientWidth ?? 1200;
    if (w >= 1280) return 4;
    if (w >= 1024) return 3;
    if (w >= 640) return 2;
    return 1;
  };

  const recompute = useCallback(() => {
    const v = visibleCount();
    setTotalPages(Math.max(1, Math.ceil(items.length / v) || 1));
    setCurrent(0);
    if (trackRef.current) trackRef.current.scrollLeft = 0;
  }, [items.length]);

  useEffect(() => {
    recompute();
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const slide = el.scrollWidth / totalPages;
      const idx = Math.round(el.scrollLeft / slide);
      setCurrent(Math.min(Math.max(idx, 0), totalPages - 1));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', recompute);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', recompute);
    };
  }, [recompute, totalPages]);

  if (items.length === 0) {
    return emptyFallback || null;
  }

  const goTo = (idx: number) => {
    const el = trackRef.current;
    if (!el) return;
    const next = Math.min(Math.max(idx, 0), totalPages - 1);
    el.scrollTo({ left: (el.scrollWidth / totalPages) * next, behavior: 'smooth' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goTo(current - 1);
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      goTo(current + 1);
      e.preventDefault();
    }
  };

  return (
    <div className="relative">
      {/* Track */}
      <div
        ref={trackRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide gap-4 pb-2 outline-none"
      >
        {items.map((item, idx) => (
          <div
            key={item.id || idx}
            className={`shrink-0 snap-start ${cardClassName}`}
          >
            {renderCard(item, idx)}
          </div>
        ))}
      </div>

      {/* Arrows */}
      {totalPages > 1 && (
        <>
          <button
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
            className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            aria-label="Oldingi"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => goTo(current + 1)}
            disabled={current === totalPages - 1}
            className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            aria-label="Keyingi"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Pagination dots */}
          <div className="flex items-center justify-center gap-1.5 mt-5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Sahifa ${i + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === current ? 'w-6 bg-amber-500' : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};