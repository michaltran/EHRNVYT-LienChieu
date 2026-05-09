import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

export default async function SignatureDetailPage({ params }: { params: { id: string } }) {
  await requireAuth(['ADMIN', 'DOCTOR', 'CONCLUDER']);

  const t = await prisma.caSignTransaction.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { fullName: true, email: true, jobTitle: true, caUserId: true, caSerialNumber: true } },
    },
  });
  if (!t) notFound();

  // Lấy thông tin target
  let targetInfo: { label: string; details: string } = { label: '—', details: '' };
  if (t.targetType === 'CLINICAL_EXAM') {
    let recordId = t.targetId;
    let specialty = '';
    if (t.targetId.includes('::')) [recordId, specialty] = t.targetId.split('::');

    const rec = await prisma.healthRecord.findUnique({
      where: { id: recordId }, include: { employee: true, examRound: true },
    }).catch(() => null);
    if (rec) {
      targetInfo = {
        label: `Khám chuyên khoa: ${specialty || t.targetId}`,
        details: `${rec.employee.fullName} • ${rec.examRound.name}`,
      };
    }
  } else if (t.targetType === 'CONCLUSION') {
    const rec = await prisma.healthRecord.findUnique({
      where: { id: t.targetId }, include: { employee: true, examRound: true },
    }).catch(() => null);
    if (rec) {
      targetInfo = {
        label: 'Kết luận sức khỏe',
        details: `${rec.employee.fullName} • ${rec.examRound.name}`,
      };
    }
  }

  return (
    <div className="space-y-5 fade-in max-w-4xl">
      <BackButton />

      <div className="card-accent">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          🔐 Chi tiết chữ ký số
        </h1>
        <p className="text-slate-500 mt-1">Mã giao dịch: <span className="font-mono">{t.id}</span></p>
        <div className="mt-4">
          {t.status === 'COMPLETED' ? (
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-lg border-2 border-green-300 bg-green-50">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl">✓</div>
              <div>
                <div className="font-bold text-green-800">CHỮ KÝ HỢP LỆ</div>
                <div className="text-xs text-green-700">Có giá trị pháp lý theo Luật Giao dịch điện tử 2005</div>
              </div>
            </div>
          ) : t.status === 'FAILED' ? (
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-lg border-2 border-red-300 bg-red-50">
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white text-2xl">✗</div>
              <div>
                <div className="font-bold text-red-800">KÝ THẤT BẠI</div>
                <div className="text-xs text-red-700">{t.errorMessage || 'Không rõ nguyên nhân'}</div>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-lg border-2 border-amber-300 bg-amber-50">
              <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white text-2xl">⏳</div>
              <div>
                <div className="font-bold text-amber-800">ĐANG CHỜ</div>
                <div className="text-xs text-amber-700">Chưa hoàn tất xác nhận từ VNPT</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-brand-500 rounded"></span>
            Đối tượng được ký
          </h2>
          <dl className="space-y-2 text-sm">
            <Row label="Loại" value={targetInfo.label} />
            <Row label="Chi tiết" value={targetInfo.details} />
            <Row label="Document ID" value={t.docId} mono />
          </dl>
        </div>

        <div className="card">
          <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-brand-500 rounded"></span>
            Người ký
          </h2>
          <dl className="space-y-2 text-sm">
            <Row label="Họ tên" value={t.user?.fullName} />
            <Row label="Chức danh" value={t.user?.jobTitle} />
            <Row label="Email" value={t.user?.email} />
            <Row label="CCCD" value={t.user?.caUserId} mono />
            <Row label="Serial chứng thư" value={t.user?.caSerialNumber} mono />
          </dl>
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-brand-500 rounded"></span>
          Thông tin ký số (VNPT SmartCA)
        </h2>
        <dl className="space-y-2 text-sm">
          <Row label="Thời gian tạo" value={new Date(t.createdAt).toLocaleString('vi-VN')} />
          {t.completedAt && <Row label="Thời gian hoàn tất" value={new Date(t.completedAt).toLocaleString('vi-VN')} />}
          <Row label="Mã giao dịch VNPT" value={t.vnptTranId} mono />
          <Row label="Tran code" value={t.tranCode} mono />
          <Row label="SHA256 hash dữ liệu" value={t.dataHash} mono break />
          {t.signatureValue && (
            <Row label="Chữ ký số (RSA-2048)" value={t.signatureValue.slice(0, 64) + '... (' + t.signatureValue.length + ' ký tự)'} mono break />
          )}
          {t.errorMessage && <Row label="Lỗi" value={t.errorMessage} />}
        </dl>
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2">📖 Cách kiểm tra tính hợp lệ độc lập</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Chữ ký số do VNPT-CA cấp phát, có thể verify bằng chứng thư công khai của VNPT</li>
          <li>Hash <span className="font-mono text-xs">{t.dataHash?.slice(0, 12)}...</span> là SHA256 của payload tại thời điểm ký, dữ liệu nội dung khám không thể bị sửa sau khi ký</li>
          <li>Mã giao dịch <span className="font-mono text-xs">{t.vnptTranId?.slice(0, 16)}...</span> có thể đối soát với VNPT để xác minh tồn tại</li>
          <li>Liên hệ VNPT (cskh@vnpt.vn / 18001260) để verify offline khi cần</li>
        </ol>
      </div>

      <Link href="/admin/signatures" className="btn-secondary inline-flex">← Tất cả giao dịch ký số</Link>
    </div>
  );
}

function Row({ label, value, mono, break: brk }: { label: string; value: string | null | undefined; mono?: boolean; break?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="text-slate-500 w-44 flex-shrink-0">{label}:</dt>
      <dd className={`flex-1 ${mono ? 'font-mono text-xs' : ''} ${brk ? 'break-all' : ''}`}>
        {value || <span className="italic text-slate-400">—</span>}
      </dd>
    </div>
  );
}
