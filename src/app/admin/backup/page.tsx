import { requireAuth } from '@/lib/auth';
import BackupClient from './client';

export default async function BackupPage() {
  await requireAuth(['ADMIN']);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Sao lưu / Phục hồi dữ liệu</h1>
      <BackupClient />
    </div>
  );
}
