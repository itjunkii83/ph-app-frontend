import { notFound } from 'next/navigation';
import { Studio } from '@/components/Studio';
import { isView } from '@/lib/types';

// Every studio view has a path (/zoltar, /effects, ...) so a hard refresh reopens
// it. The root path (/) is handled by app/page.tsx and defaults to backgrounds.
export default async function ViewPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  if (!isView(view)) notFound();
  return <Studio initialView={view} />;
}
