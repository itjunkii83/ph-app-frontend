'use client';

import { useEffect } from 'react';
import { useSession } from '@/lib/zoltar/useSession';
import { ChatColumn } from './ChatColumn';
import { DebugPanel } from './DebugPanel';

// Two-column debug surface: chat on the left, the debug panel on the right. Owns the
// session hook. On mount it fires the opener, but only when the transcript is empty
// and no call is in flight (the guard lives in useSession).
export function ZoltarView() {
  const s = useSession();
  const { openIfEmpty } = s;

  useEffect(() => {
    openIfEmpty();
  }, [openIfEmpty]);

  return (
    <div className="flex min-h-0 flex-1">
      <ChatColumn
        transcript={s.session.transcript}
        loading={s.loading}
        error={s.error}
        onSend={s.send}
        onRegenerate={s.regenerate}
      />
      <DebugPanel
        session={s.session}
        setModel={s.setModel}
        setThinking={s.setThinking}
        markStarted={s.markStarted}
        startFresh={s.startFresh}
        exportSession={s.exportSession}
      />
    </div>
  );
}
