import { AdminNav } from '@/components/admin/layout/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AdminNav />
      <main
        style={{
          flex: 1,
          padding: '32px 40px',
          overflowY: 'auto',
          background: '#f5f5f7',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        }}
      >
        {children}
      </main>
    </div>
  );
}
