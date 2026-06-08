'use client';

interface StaticBackgroundProps {
  src: string;
  alt?: string;
}

export default function StaticBackground({ src, alt = 'Background' }: StaticBackgroundProps) {
  return (
    <div
      className="fixed inset-0 w-full h-full"
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      role="img"
      aria-label={alt}
    />
  );
}
