import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/constants';
import BackButton from '@/components/BackButton';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chưa khám',
  IN_PROGRESS: 'Đang khám',
  WAITING_REVIEW: 'Chờ duyệt',
  WAITING_CONCLUSION: 'Chờ kết luận',
  COMPLETED: 'Hoàn tất',
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'badge-slate',
  IN_PROGRESS: 'badge-primary',
  WAITING_REVIEW: 'badge-warning',
  WAITING_CONCLUSION: 'badge-warning',
  COMPLETED: 'badge-success',
};

export default async function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      department: true,
      healthRecords: {
        include: { examRound: true },
        orderBy: { examRound: { year: 'desc' } },
      },
    },
  });
  if (!employee) notFound();

  const age = employee.dateOfBirth
    ? new Date().getFullYear() - new Date(employee.dateOfBirth).getFullYear()
    : null;

  return (
    <div className="space-y-5 fade-in">
      <BackButton label="Quay lại danh sách" />

      {/* Header với gradient */}
      <div className="card-accent flex flex-wrap items-start gap-5">
        {employee.photoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={employee.photoUrl}
            alt=""
            className="w-32 h-40 rounded-lg object-cover border-2 border-brand-100 shadow-md"
          />
        ) : (
          <div className="w-32 h-40 rounded-lg bg-gradient-to-br from-brand-100 to-brand-50 border-2 border-brand-200 flex items-center justify-center text-5xl font-bold text-brand-400 shadow-md">
            {employee.fullName.split(' ').pop()?.[0] ?? '?'}
          </div>
        )}

        <div className="flex-1 min-w-[300px]">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{employee.fullName}</h1>
              <p className="text-slate-500 mt-1">
                {employee.position ?? 'Nhân viên'} • {employee.department.name}
              </p>
            </div>
            <Link href={`/admin/employees/${employee.id}/edit`} className="btn-secondary">
              ✏️ Chỉnh sửa thông tin
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 mt-4 text-sm">
            <Info label="Giới tính" value={employee.gender === 'MALE' ? 'Nam' : employee.gender === 'FEMALE' ? 'Nữ' : '—'} />
            <Info label="Sinh ngày" value={employee.dateOfBirth ? `${formatDate(employee.dateOfBirth)} (${age} tuổi)` : '—'} />
            <Info label="CCCD" value={employee.idNumber ?? '—'} />
            <Info label="SĐT" value={employee.phone ?? '—'} />
            <Info label="Loại HĐ" value={employee.employmentType ?? '—'} />
            <Info label="Bằng cấp" value={employee.qualification ?? '—'} />
          </div>
        </div>
      </div>

      {/* Thông tin chi tiết */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-brand-500 rounded"></span>
            Thông tin cá nhân
          </h2>
          <dl className="space-y-2 text-sm">
            <Row label="Địa chỉ" value={employee.currentAddress} />
            <Row label="Nghề nghiệp" value={employee.occupation} />
            <Row label="Nơi công tác" value={employee.workplace} />
            <Row label="Bắt đầu làm" value={employee.startWorkingDate ? formatDate(employee.startWorkingDate) : null} />
            <Row label="Chức danh" value={employee.jobTitle} />
          </dl>
        </div>

        <div className="card">
          <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-brand-500 rounded"></span>
            Tiền sử bệnh
          </h2>
          <dl className="space-y-2 text-sm">
            <Row label="Gia đình" value={employee.familyHistory} multiline />
            <Row label="Bản thân" value={
              employee.personalHistory
                ? (() => {
                    try {
                      const arr = JSON.parse(employee.personalHistory);
                      if (Array.isArray(arr) && arr.length > 0) {
                        return arr.map((x: any) => x.tenBenh).filter(Boolean).join(', ') || '—';
                      }
                    } catch {}
                    return '—';
                  })()
                : null
            } />
          </dl>
        </div>
      </div>

      {/* Hồ sơ khám sức khỏe theo năm */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-brand-500 rounded"></span>
            Hồ sơ khám sức khỏe theo năm
            <span className="badge-primary ml-2">{employee.healthRecords.length}</span>
          </h2>
        </div>

        {employee.healthRecords.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            Nhân viên này chưa có hồ sơ khám sức khỏe.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {employee.healthRecords.map((rec) => (
              <div key={rec.id} className="border border-slate-200 rounded-lg p-4 hover:border-brand-300 hover:shadow-md transition-all bg-gradient-to-br from-white to-brand-50/30">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bold text-2xl text-brand-700">{rec.examRound.year}</div>
                    <div className="text-xs text-slate-500">{rec.examRound.name}</div>
                  </div>
                  <span className={STATUS_COLOR[rec.status] || 'badge-slate'}>
                    {STATUS_LABEL[rec.status] || rec.status}
                  </span>
                </div>
                {rec.finalClassification && (
                  <div className="text-xs text-slate-600 mb-3">
                    Phân loại: <strong>{rec.finalClassification.replace('LOAI_', 'Loại ')}</strong>
                  </div>
                )}
                <div className="flex gap-2">
                  <Link
                    href={`/records/${rec.id}/book`}
                    className="flex-1 text-center px-3 py-2 bg-gradient-to-br from-amber-500 to-amber-600 text-white text-xs font-semibold rounded hover:from-amber-600 hover:to-amber-700 transition shadow-sm"
                  >
                    📖 Xem hồ sơ
                  </Link>
                  <Link
                    href={`/records/${rec.id}/print`}
                    className="px-3 py-2 bg-white border border-slate-300 text-slate-600 text-xs font-medium rounded hover:bg-slate-50 transition"
                    title="In PDF"
                  >
                    🖨️
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-800">{value}</div>
    </div>
  );
}

function Row({ label, value, multiline }: { label: string; value: string | null | undefined; multiline?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="text-slate-500 w-28 flex-shrink-0">{label}:</dt>
      <dd className={`flex-1 ${multiline ? 'whitespace-pre-wrap' : ''}`}>
        {value || <span className="italic text-slate-400">Chưa có</span>}
      </dd>
    </div>
  );
}
