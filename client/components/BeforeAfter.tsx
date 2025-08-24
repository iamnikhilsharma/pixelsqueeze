import React, { useRef, useState, useEffect } from 'react';

interface BeforeAfterProps {
  beforeSrc: string;
  afterSrc: string;
  height?: number;
  className?: string;
}

export default function BeforeAfter({ beforeSrc, afterSrc, height = 360, className = '' }: BeforeAfterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [percent, setPercent] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const onPointerMove = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(rect.left, Math.min(clientX, rect.right));
    const newPercent = ((x - rect.left) / rect.width) * 100;
    setPercent(Math.max(0, Math.min(100, Math.round(newPercent))));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      if (e instanceof TouchEvent) {
        onPointerMove(e.touches[0].clientX);
      } else {
        onPointerMove(e.clientX);
      }
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove as any);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging]);

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white ${className}`} style={{ height }} ref={containerRef}>
      <img src={beforeSrc} alt="Before" className="absolute inset-0 h-full w-full object-cover select-none" draggable={false} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ width: `${percent}%` }}>
        <img src={afterSrc} alt="After" className="h-full w-full object-cover select-none" draggable={false} />
      </div>
      {/* Slider */}
      <div
        className="absolute top-0 bottom-0"
        style={{ left: `calc(${percent}% - 1px)` }}
      >
        <div className="h-full w-0.5 bg-primary-500" />
        <button
          type="button"
          aria-label="Drag to compare"
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-primary-600 text-white shadow-medium flex items-center justify-center"
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        >
          ||
        </button>
      </div>
      {/* Labels */}
      <div className="absolute left-3 top-3 text-xs font-medium px-2 py-1 rounded bg-black/50 text-white">Before</div>
      <div className="absolute right-3 top-3 text-xs font-medium px-2 py-1 rounded bg-black/50 text-white">After</div>
    </div>
  );
}
