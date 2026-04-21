'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  employee?: any;
  departments: { id: string; name: string }[];
};

export default function EmployeeForm({ employee, departments }: Props) {
  const router = useRouter();
  const isEdit = !!employee?.id;
  const [form, setForm] = useState({
    fullName: employee?.fullName ?? '',
    gender: employee?.gender ?? 'MALE',
    dateOfBirth: employee?.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().slice(0, 10) : '',
    idNumber: employee?.idNumber ?? '',
    phone: employee?.phone ?? '',
    currentAddress: employee?.currentAddress ?? '',
    occupation: employee?.occupation ?? 'Viên chức y tế',
    workplace: employee?.workplace ?? 'Trung tâm Y tế khu vực Liên Chiểu',
    startWorkingDate: employee?.startWorkingDate ? new Date(employee.startWorkingDate).toISOString().slice(0, 10) : '',
    position: employee?.position ?? '',
    departmentId: employee?.departmentId ?? departments[0]?.id ?? '',
    employmentType: employee?.employmentType ?? '',
    qualification: employee?.qualification ?? '',
    jobTitle: employee?.jobTitle ?? '',
    photoUrl: employee?.photoUrl ?? '',
    familyHistory: employee?.familyHistory ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErr('Ảnh quá lớn, cần dưới 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr('');
    try {
      const url = isEdit ? `/api/admin/employees/${employee.id}` : '/api/admin/employees';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi');
      router.push('/admin/employees');
      router.refresh();
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  async function remove() {
    if (!confirm('Xóa nhân viên này?')) return;
    const res = await fetch(`/api/admin/employees/${employee.id}`, { method: 'DELETE' });
    if (res.ok) { router.push('/admin/employees'); router.refresh(); }
  }

  const u = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid md:grid-cols-4 gap-5">
        <div className="md:col-span-1">
          <div className="card text-center">
            {form.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.photoUrl} alt="" className="h-40 w-32 mx-auto object-cover rounded border" />
            ) : (
              <div className="h-40 w-32 mx-auto bg-slate-100 rounded border border-dashed flex items-center justify-center text-xs text-slate-400">
                Ảnh 4x6 cm
              </div>
            )}
            <input type="file" accept="image/*" onChange={handlePhoto} className="mt-3 text-xs w-full" />
          </div>
        </div>

        <div className="md:col-span-3 card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">1. Họ và tên (in hoa)</label>
              <input required value={form.fullName} onChange={u('fullName')} className="input uppercase" />
            </div>
            <div>
              <label className="label">2. Giới tính</label>
              <select value={form.gender} onChange={u('gender')} className="input">
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div>
              <label className="label">3. Ngày sinh</label>
              <input type="date" value={form.dateOfBirth} onChange={u('dateOfBirth')} className="input" />
            </div>
            <div>
              <label className="label">4. Số CCCD / Định danh</label>
              <input value={form.idNumber} onChange={u('idNumber')} className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">6. Chỗ ở hiện tại</label>
              <input value={form.currentAddress} onChange={u('currentAddress')} className="input" />
            </div>
            <div>
              <label className="label">SĐT</label>
              <input value={form.phone} onChange={u('phone')} className="input" />
            </div>
            <div>
              <label className="label">7. Nghề nghiệp</label>
              <input value={form.occupation} onChange={u('occupation')} className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">8. Nơi công tác</label>
              <input value={form.workplace} onChange={u('workplace')} className="input" />
            </div>
            <div>
              <label className="label">Khoa / Phòng</label>
              <select value={form.departmentId} onChange={u('departmentId')} className="input" required>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Chức vụ</label>
              <input value={form.position} onChange={u('position')} className="input" />
            </div>
            <div>
              <label className="label">9. Ngày vào làm việc</label>
              <input type="date" value={form.startWorkingDate} onChange={u('startWorkingDate')} className="input" />
            </div>
            <div>
              <label className="label">Loại hợp đồng</label>
              <select value={form.employmentType} onChange={u('employmentType')} className="input">
                <option value="">-- Chọn --</option>
                <option>Viên chức</option>
                <option>HĐ 68</option>
                <option>Trong chỉ tiêu</option>
                <option>HĐ thỏa thuận</option>
                <option>Khác</option>
              </select>
            </div>
            <div>
              <label className="label">Trình độ chuyên môn</label>
              <input value={form.qualification} onChange={u('qualification')} className="input" />
            </div>
            <div>
              <label className="label">Chức danh nghề nghiệp</label>
              <input value={form.jobTitle} onChange={u('jobTitle')} className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">11. Tiền sử bệnh của gia đình</label>
              <textarea rows={3} value={form.familyHistory} onChange={u('familyHistory')} className="input" />
            </div>
          </div>
        </div>
      </div>

      {err && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{err}</div>}

      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
        </button>
        {isEdit && (
          <button type="button" onClick={remove} className="btn-danger">Xóa</button>
        )}
      </div>
    </form>
  );
}
