'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type E = {
  id: string; fullName: string; gender: string;
  birthYear: number | null; position: string | null;
  department: string; employmentType: string | null;
  photoUrl: string | null;
};

export default function EmployeesClient({
  employees, departments, currentQ, currentDept,
}: {
  employees: E[];
  departments: { id: string; name: string }[];
  currentQ: string;
  currentDept: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }
  function toggleAll() {
    if (selected.size === employees.length) setSelected(new Set());
    else setSelected(new Set(employees.map((e) => e.id)));
  }

  async function removeEmployee(id: string, name: string) {
    if (!confirm(`Xóa nhân viên "${name}"?\n\nNếu NV đã có hồ sơ khám → toàn bộ hồ sơ + kết quả khám sẽ bị xóa theo.`)) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/employees/${id}`, { method: 'DELETE' });
    setDeleting(null);
    if (res.ok) {
      const next = new Set(selected); next.delete(id); setSelected(next);
      router.refresh();
    } else {
      const data = await res.json();
      // Fallback: dùng bulk-delete để cascade
      if (confirm('Lỗi xóa đơn lẻ: ' + (data.error || '') + '\n\nDùng cách xóa cascade (xóa cả hồ sơ liên quan)?')) {
        const r2 = await fetch('/api/admin/employees/bulk', {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [id] }),
        });
        const d2 = await r2.json();
        if (r2.ok) router.refresh();
        else alert('Vẫn lỗi: ' + (d2.error || 'không rõ'));
      }
    }
  }

  async function removeBulk() {
    if (selected.size === 0) return;
    const names = employees.filter((e) => selected.has(e.id)).slice(0, 5).map((e) => e.fullName).join(', ');
    const more = selected.size > 5 ? `, và ${selected.size - 5} người khác` : '';
    if (!confirm(`Xóa ${selected.size} nhân viên: ${names}${more}?\n\n⚠️ Toàn bộ hồ sơ khám + kết quả của họ sẽ bị xóa theo. Hành động không thể khôi phục.`)) return;
    setBulkDeleting(true);
    const res = await fetch('/api/admin/employees/bulk', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    const data = await res.json();
    setBulkDeleting(false);
    if (res.ok) {
      alert(`✅ ${data.message}`);
      setSelected(new Set());
      router.refresh();
    } else alert('❌ ' + (data.error || 'Lỗi'));
  }

  // Build query string cho export (giữ filter hiện tại)
  const exportQuery = new URLSearchParams();
  if (currentDept) exportQuery.set('dept', currentDept);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-slate-800">Danh sách nhân viên</h1>
        <div className="flex gap-2 flex-wrap">
          <a
            href="/api/admin/employees/export-template"
            className="btn-secondary"
            title="Tải file Excel trống để phát cho các khoa điền"
          >
            📥 Template Excel trống
          </a>
          <a
            href={`/api/admin/employees/export?${exportQuery.toString()}`}
            className="btn-secondary"
            title="Xuất danh sách nhân viên hiện có ra Excel"
          >
            📤 Export Excel
          </a>
          <Link href="/records/blank" target="_blank" className="btn-secondary">
            📄 In sổ trắng (Mẫu 03)
          </Link>
          <Link href="/admin/employees/import" className="btn-secondary">
            Import Excel
          </Link>
          <Link href="/admin/employees/new" className="btn-primary">
            + Thêm nhân viên
          </Link>
        </div>
      </div>

      <form className="card flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="label">Tìm theo tên</label>
          <input name="q" defaultValue={currentQ} className="input" placeholder="Ví dụ: Nguyễn Thành Tân" />
        </div>
        <div className="md:w-64">
          <label className="label">Khoa / Phòng</label>
          <select name="dept" defaultValue={currentDept} className="input">
            <option value="">-- Tất cả --</option>
            {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
          </select>
        </div>
        <button type="submit" className="btn-primary w-full md:w-auto">Lọc</button>
      </form>

      {selected.size > 0 && (
        <div className="card bg-amber-50 border-amber-300 flex items-center justify-between flex-wrap gap-2 sticky top-2 z-20">
          <div className="text-sm">
            <strong>Đã chọn {selected.size} nhân viên</strong>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSelected(new Set())} className="btn-secondary text-sm">Bỏ chọn</button>
            <button onClick={removeBulk} disabled={bulkDeleting} className="btn-danger text-sm">
              {bulkDeleting ? 'Đang xóa...' : `🗑️ Xóa ${selected.size} nhân viên (kèm hồ sơ)`}
            </button>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-auto">
        <table className="table-simple">
          <thead>
            <tr>
              <th className="w-10">
                <input
                  type="checkbox"
                  checked={selected.size > 0 && selected.size === employees.length}
                  ref={(el) => { if (el) el.indeterminate = selected.size > 0 && selected.size < employees.length; }}
                  onChange={toggleAll}
                  className="cursor-pointer"
                  title="Chọn tất cả"
                />
              </th>
              <th>Ảnh</th>
              <th>Họ tên</th>
              <th>Giới tính</th>
              <th>Năm sinh</th>
              <th>Chức vụ</th>
              <th>Khoa/Phòng</th>
              <th>Loại HĐ</th>
              <th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr
                key={e.id}
                onClick={() => router.push(`/admin/employees/${e.id}`)}
                className={`cursor-pointer ${selected.has(e.id) ? 'bg-amber-50/60' : ''}`}
              >
                <td onClick={(ev) => ev.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(e.id)}
                    onChange={() => toggleSelect(e.id)}
                    className="cursor-pointer"
                  />
                </td>
                <td>
                  {e.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.photoUrl} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-brand-100" />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-sm font-bold text-brand-700 ring-2 ring-brand-100">
                      {e.fullName.split(' ').pop()?.[0] ?? '?'}
                    </div>
                  )}
                </td>
                <td className="font-semibold text-slate-800">{e.fullName}</td>
                <td>{e.gender === 'MALE' ? '👨 Nam' : e.gender === 'FEMALE' ? '👩 Nữ' : ''}</td>
                <td>{e.birthYear ?? ''}</td>
                <td className="text-slate-600">{e.position ?? ''}</td>
                <td className="text-slate-600">{e.department}</td>
                <td><span className="badge-slate">{e.employmentType ?? ''}</span></td>
                <td className="text-right" onClick={(ev) => ev.stopPropagation()}>
                  <button
                    onClick={() => removeEmployee(e.id, e.fullName)}
                    disabled={deleting === e.id}
                    className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm disabled:opacity-50 transition"
                  >
                    {deleting === e.id ? '...' : '🗑️ Xóa'}
                  </button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={9} className="text-center text-slate-500 py-8">Chưa có nhân viên nào</td></tr>
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
