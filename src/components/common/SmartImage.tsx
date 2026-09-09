import React, { useState } from 'react';
import { SubjectVisual } from '../../config/subjectVisuals';

interface SmartImageProps {
  src?: string;
  alt: string;
  visual?: SubjectVisual;
  ratio?: string;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  rounded?: boolean;
}

// ---------------------------------------------------------------------------
// SmartImage — lazy, layout-stable image with a branded gradient/icon fallback.
// Never shows a broken-image icon: if the external image fails or is missing,
// the card degrades gracefully to the subject visual (gradient + icon).
// ---------------------------------------------------------------------------

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  visual,
  ratio = '16 / 10',
  className = '',
  imgClassName = '',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  rounded = true,
}) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  const hasSrc = src && typeof src === 'string' && src.trim() !== '';
  const showImage = hasSrc && status !== 'error';
  const FallbackIcon = visual?.icon;

  // Build responsive srcSet by swapping the Unsplash `w=` width parameter.
  const srcSet = hasSrc
    ? [400, 800, 1200]
        .map((w) => `${(src as string).replace(/w=\d+/, `w=${w}`)} ${w}w`)
        .join(', ')
    : undefined;

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${rounded ? 'rounded-t-3xl' : ''} ${className}`}
      style={{ aspectRatio: ratio }}
      role="img"
      aria-label={showImage ? undefined : alt}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          sizes={sizes}
          srcSet={srcSet}
          className={`w-full h-full object-cover object-center transition-opacity duration-500 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          } ${imgClassName}`}
        />
      ) : (
        <div
          className={`w-full h-full flex flex-col items-center justify-center text-white bg-gradient-to-br ${visual?.gradient || 'from-slate-700 via-slate-600 to-slate-500'}`}
        >
          {FallbackIcon && <FallbackIcon className="w-12 h-12 opacity-90" strokeWidth={1.5} />}
          <span className="text-[10px] font-bold uppercase tracking-widest mt-2 px-4 text-center opacity-80">
            {visual?.label || alt}
          </span>
        </div>
      )}
    </div>
  );
};