'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

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
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 sidebar-gradient text-slate-100 flex flex-col no-print">
        <div className="p-5 border-b border-white/10">
          <div className="font-bold text-white">TTYT Liên Chiểu</div>
          <div className="text-xs text-slate-300 mt-0.5">Hồ sơ sức khỏe định kỳ</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + '/');
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`block px-3 py-2 rounded text-sm transition ${
                  active ? 'bg-white/15 text-white font-medium shadow-sm' : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 text-xs">
          <div className="font-medium text-white">{user.fullName}</div>
          <div className="text-slate-300 mt-0.5">{roleLabel[user.role] ?? user.role}</div>
          <button onClick={logout} className="mt-3 w-full btn bg-white/10 text-white hover:bg-white/20">
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-x-auto">
        <div>{children}</div>
        <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400 italic">
          Software Copyright Powered by Dat Dat
        </div>
      </main>
    </div>
  );
}
