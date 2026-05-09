import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

export default async function SignaturesAuditPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  await requireAuth(['ADMIN']);

  const where: any = {};
  if (searchParams.status) where.status = searchParams.status;

  const txns = await prisma.caSignTransaction.findMany({
    where,
    include: { user: { select: { fullName: true, email: true, jobTitle: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const stats = {
    total: await prisma.caSignTransaction.count(),
    completed: await prisma.caSignTransaction.count({ where: { status: 'COMPLETED' } }),
    failed: await prisma.caSignTransaction.count({ where: { status: 'FAILED' } }),
    pending: await prisma.caSignTransaction.count({ where: { status: 'PENDING' } }),
  };

  return (
    <div className="space-y-5 fade-in">
      <BackButton label="Quay lại" />
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <span>🔐</span> Nhật ký ký số VNPT SmartCA
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card">
          <div className="text-xs text-slate-500 uppercase">Tổng giao dịch</div>
          <div className="text-3xl font-bold text-slate-800 mt-1">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-slate-500 uppercase">Thành công</div>
          <div className="text-3xl font-bold text-green-600 mt-1">{stats.completed}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-slate-500 uppercase">Thất bại</div>
          <div className="text-3xl font-bold text-red-600 mt-1">{stats.failed}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-slate-500 uppercase">Đang chờ</div>
          <div className="text-3xl font-bold text-amber-600 mt-1">{stats.pending}</div>
        </div>
      </div>

      {/* Filters */}
      <form className="card flex flex-col md:flex-row gap-3 md:items-end">
        <div className="md:w-64">
          <label className="label">Trạng thái</label>
          <select name="status" defaultValue={searchParams.status ?? ''} className="input">
            <option value="">-- Tất cả --</option>
            <option value="COMPLETED">Hoàn tất</option>
            <option value="FAILED">Thất bại</option>
            <option value="PENDING">Đang chờ</option>
          </select>
        </div>
        <button type="submit" className="btn-primary md:w-auto">Lọc</button>
      </form>

      <div className="card p-0 overflow-auto">
        <table className="table-simple">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người ký</th>
              <th>Loại</th>
              <th>Hash (8 ký tự đầu)</th>
              <th>VNPT Tran ID</th>
              <th>Trạng thái</th>
              <th className="text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {txns.map((t) => (
              <tr key={t.id}>
                <td className="text-xs">{new Date(t.createdAt).toLocaleString('vi-VN')}</td>
                <td>
                  <div className="font-medium">{t.user?.fullName ?? '—'}</div>
                  <div className="text-xs text-slate-500">{t.user?.jobTitle ?? ''}</div>
                </td>
                <td><span className="badge-slate">{t.targetType === 'CLINICAL_EXAM' ? 'Khám CK' : 'Kết luận'}</span></td>
                <td className="font-mono text-xs">{t.dataHash?.slice(0, 12)}…</td>
                <td className="font-mono text-xs">{t.vnptTranId?.slice(0, 14) ?? '—'}…</td>
                <td>
                  {t.status === 'COMPLETED' && <span className="badge-success">✓ Thành công</span>}
                  {t.status === 'FAILED' && <span className="badge-danger">✗ Thất bại</span>}
                  {t.status === 'PENDING' && <span className="badge-warning">⏳ Chờ</span>}
                </td>
                <td className="text-right">
                  <Link href={`/admin/signatures/${t.id}`} className="text-brand-600 hover:underline text-sm">
                    Xem
                  </Link>
                </td>
              </tr>
            ))}
            {txns.length === 0 && (
              <tr><td colSpan={7} className="text-center text-slate-500 py-8">Chưa có giao dịch ký số nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500 italic">
        Hiển thị tối đa 200 giao dịch gần nhất. Tất cả chữ ký số có giá trị pháp lý theo Luật Giao dịch điện tử.
      </div>
    </div>
  );
}
