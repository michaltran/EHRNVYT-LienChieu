import { requireAuth } from '@/lib/auth';
import AppShell from '@/components/AppShell';

const NAV = [
  { href: '/doctor', label: 'Hàng đợi khám' },
  { href: '/doctor/profile', label: 'Chữ ký & thông tin' },
];

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const s = await requireAuth(['DOCTOR']);
  return <AppShell user={s} nav={NAV}>{children}</AppShell>;
}
