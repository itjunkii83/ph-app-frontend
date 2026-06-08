import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wisdom',
  description: 'Interactive WebGPU particle experience',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
