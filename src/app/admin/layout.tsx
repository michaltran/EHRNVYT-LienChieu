import { requireAuth } from '@/lib/auth';
import AppShell from '@/components/AppShell';

const NAV = [
  { href: '/admin', label: 'Tổng quan' },
  { href: '/admin/employees', label: 'Nhân viên' },
  { href: '/admin/departments', label: 'Khoa / Phòng' },
  { href: '/admin/users', label: 'Tài khoản' },
  { href: '/admin/rounds', label: 'Đợt khám' },
  { href: '/admin/records', label: 'Hồ sơ khám' },
  { href: '/admin/reports', label: 'Báo cáo thống kê' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireAuth(['ADMIN']);
  return <AppShell user={s} nav={NAV}>{children}</AppShell>;
}
