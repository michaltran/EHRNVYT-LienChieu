'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

type NavItem = { href: string; label: string; icon?: string };

export default function AppShell({
  user,
  nav,
  children,
}: {
  user: { fullName: string; email: string; role: string };
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Đóng drawer khi đổi route
  useEffect(() => { setOpen(false); }, [pathname]);

  // Khoá scroll body khi drawer mở
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const roleLabel: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    DOCTOR: 'Bác sĩ khám',
    CONCLUDER: 'Bác sĩ kết luận',
    DEPT_REP: 'Đại diện khoa',
    EMPLOYEE: 'Nhân viên',
    KTV_XETNGHIEM: 'KTV Xét nghiệm',
    KTV_CHANDOANHINHANH: 'KTV CĐHA',
    VITAL_STAFF: 'KTV/ĐD đo thể lực',
  };

  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const Sidebar = (
    <aside
      className={`sidebar-gradient text-slate-100 flex flex-col no-print h-full w-72 md:w-64`}
    >
      <div className="p-4 md:p-5 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white leading-tight truncate">TTYT Liên Chiểu</div>
          <div className="text-[10px] text-slate-300">Hồ sơ sức khỏe định kỳ</div>
        </div>
        {/* Nút đóng cho mobile */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden p-1.5 rounded hover:bg-white/15 text-white"
          aria-label="Đóng menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round"/></svg>
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + '/');
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition ${
                active
                  ? 'bg-white/15 text-white font-medium shadow-sm'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              {it.icon && <span className="text-base w-5 text-center">{it.icon}</span>}
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 text-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-white truncate">{user.fullName}</div>
            <div className="text-slate-300 text-[10px]">{roleLabel[user.role] ?? user.role}</div>
          </div>
        </div>
        <button onClick={logout} className="w-full btn bg-white/10 text-white hover:bg-white/20 text-xs">
          Đăng xuất
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex">
      {/* Sidebar cố định trên desktop */}
      <div className="hidden md:flex md:flex-shrink-0">{Sidebar}</div>

      {/* Drawer mobile + overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {Sidebar}
      </div>

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar mobile */}
        <header className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 flex items-center justify-between px-3 py-2 no-print">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
            aria-label="Mở menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round"/></svg>
          </button>
          <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
            <div className="w-7 h-7 rounded bg-brand-100 flex items-center justify-center flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/images/logo.png" alt="" className="w-5 h-5 object-contain" />
            </div>
            <div className="font-bold text-slate-800 text-sm truncate">TTYT Liên Chiểu</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {initials}
          </div>
        </header>

        <div className="flex-1 p-3 md:p-6 overflow-x-hidden">
          {children}
          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400 italic">
            Software Copyright Powered by Dat Dat
          </div>
        </div>
      </main>
    </div>
  );
}
