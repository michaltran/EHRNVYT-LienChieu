import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatDate } from '@/lib/constants';

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: { q?: string; dept?: string };
}) {
  const q = searchParams.q?.trim();
  const dept = searchParams.dept;

  const where: any = {};
  if (q) where.fullName = { contains: q };
  if (dept) where.departmentId = dept;

  const [employees, departments] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: { department: true },
      orderBy: [{ department: { name: 'asc' } }, { fullName: 'asc' }],
      take: 300,
    }),
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Danh sách nhân viên</h1>
        <div className="space-x-2">
          <Link href="/admin/employees/import" className="btn-secondary">Import Excel</Link>
          <Link href="/admin/employees/new" className="btn-primary">Thêm nhân viên</Link>
        </div>
      </div>

      <form className="card flex gap-3 items-end">
        <div className="flex-1">
          <label className="label">Tìm theo tên</label>
          <input name="q" defaultValue={q} className="input" placeholder="Ví dụ: Nguyễn Thành Tân" />
        </div>
        <div className="w-64">
          <label className="label">Khoa / Phòng</label>
          <select name="dept" defaultValue={dept ?? ''} className="input">
            <option value="">-- Tất cả --</option>
            {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
          </select>
        </div>
        <button type="submit" className="btn-primary">Lọc</button>
      </form>

      <div className="card p-0 overflow-auto">
        <table className="table-simple">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Họ tên</th>
              <th>Giới tính</th>
              <th>Năm sinh</th>
              <th>Chức vụ</th>
              <th>Khoa/Phòng</th>
              <th>Loại HĐ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td>
                  {e.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.photoUrl} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      {e.fullName.split(' ').pop()?.[0] ?? '?'}
                    </div>
                  )}
                </td>
                <td className="font-medium">{e.fullName}</td>
                <td>{e.gender === 'MALE' ? 'Nam' : e.gender === 'FEMALE' ? 'Nữ' : ''}</td>
                <td>{e.dateOfBirth ? new Date(e.dateOfBirth).getFullYear() : ''}</td>
                <td>{e.position ?? ''}</td>
                <td>{e.department.name}</td>
                <td><span className="badge bg-slate-100 text-slate-700">{e.employmentType ?? ''}</span></td>
                <td><Link href={`/admin/employees/${e.id}`} className="text-brand-600 hover:underline">Sửa</Link></td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-500 py-8">Chưa có nhân viên nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {employees.length >= 300 && (
        <p className="text-xs text-slate-500">Hiển thị 300 kết quả đầu. Dùng bộ lọc để thu hẹp.</p>
      )}
    </div>
  );
}
