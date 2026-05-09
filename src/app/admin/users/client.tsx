'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_SPECIALTIES, SPECIALTY_LABELS, ROLE_LABELS } from '@/lib/constants';

type U = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  specialties: string | null;
  department: string | null;
  departmentId: string | null;
  jobTitle: string | null;
  isActive: boolean;
};

const ROLES = [
  { v: 'ADMIN', l: 'Quản trị viên' },
  { v: 'DOCTOR', l: 'Bác sĩ khám' },
  { v: 'CONCLUDER', l: 'Bác sĩ kết luận' },
  { v: 'VITAL_STAFF', l: 'KTV/ĐD đo thể lực' },
  { v: 'KTV_XETNGHIEM', l: 'KTV Xét nghiệm' },
  { v: 'KTV_CHANDOANHINHANH', l: 'KTV CĐHA' },
  { v: 'DEPT_REP', l: 'Đại diện khoa' },
  { v: 'EMPLOYEE', l: 'Nhân viên' },
];

export default function UsersClient({ users, departments }: { users: U[]; departments: { id: string; name: string }[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: '', password: '', fullName: '', role: 'DOCTOR',
    departmentId: '', specialties: [] as string[], jobTitle: '',
  });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr('');
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ email: '', password: '', fullName: '', role: 'DOCTOR', departmentId: '', specialties: [], jobTitle: '' });
      router.refresh();
    } else setErr((await res.json()).error || 'Lỗi');
  }

  async function resetPass(id: string) {
    const p = prompt('Mật khẩu mới (≥4 ký tự):');
    if (!p) return;
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: p }),
    });
    const data = await res.json();
    if (res.ok) alert('✅ Đã đổi mật khẩu'); else alert('❌ ' + (data.error || 'Lỗi'));
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
  }

  async function removeUser(u: U) {
    if (!confirm(`Xóa tài khoản "${u.fullName}" (${u.email})?\n\n• Nếu user đã ký các hồ sơ → chỉ vô hiệu hoá để giữ lịch sử.\n• Nếu chưa ký gì → xóa hẳn.`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      alert(data.soft ? '⚠️ Đã vô hiệu hoá (giữ lịch sử ký)' : '✅ Đã xóa');
      router.refresh();
    } else alert('❌ ' + (data.error || 'Lỗi'));
  }

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Đóng' : '+ Thêm tài khoản'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="label">Email</label>
              <input required type="email" className="input" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value.toLowerCase() })} />
            </div>
            <div><label className="label">Mật khẩu</label>
              <input required type="text" className="input" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div><label className="label">Họ tên</label>
              <input required className="input" value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div><label className="label">Vai trò</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
              </select>
            </div>
            {(form.role === 'DOCTOR' || form.role === 'CONCLUDER') && (
              <div className="md:col-span-2"><label className="label">Chức danh (hiển thị khi ký)</label>
                <input className="input" value={form.jobTitle}
                  placeholder="VD: BS CKI Nội khoa, Giám đốc TTYT..."
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
              </div>
            )}
            {(form.role === 'DEPT_REP' || form.role === 'EMPLOYEE') && (
              <div className="md:col-span-2"><label className="label">Khoa / Phòng</label>
                <select className="input" value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                  <option value="">--</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
            {form.role === 'DOCTOR' && (
              <div className="md:col-span-2">
                <label className="label">Chuyên khoa khám được (chọn nhiều)</label>
                <div className="grid grid-cols-2 gap-1 bg-slate-50 p-2 rounded max-h-48 overflow-auto">
                  {ALL_SPECIALTIES.map((s) => (
                    <label key={s} className="text-sm flex items-center gap-2">
                      <input type="checkbox" checked={form.specialties.includes(s)}
                        onChange={(e) => setForm({
                          ...form,
                          specialties: e.target.checked
                            ? [...form.specialties, s]
                            : form.specialties.filter((x) => x !== s),
                        })} />
                      {SPECIALTY_LABELS[s]}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
          <button className="btn-primary" disabled={loading}>{loading ? 'Đang lưu...' : 'Tạo tài khoản'}</button>
        </form>
      )}

      <div className="card p-0 overflow-auto">
        <table className="table-simple">
          <thead><tr><th>Email</th><th>Họ tên</th><th>Vai trò</th><th>Khoa / Chuyên khoa</th><th>Trạng thái</th><th className="text-right">Thao tác</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <UserRow
                key={u.id} u={u} departments={departments}
                editing={editing === u.id}
                onEdit={() => setEditing(u.id)}
                onCancelEdit={() => setEditing(null)}
                onSaved={() => { setEditing(null); router.refresh(); }}
                onResetPass={() => resetPass(u.id)}
                onToggle={() => toggle(u.id, u.isActive)}
                onDelete={() => removeUser(u)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function UserRow({
  u, departments, editing, onEdit, onCancelEdit, onSaved, onResetPass, onToggle, onDelete,
}: {
  u: U;
  departments: { id: string; name: string }[];
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onResetPass: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState({
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    jobTitle: u.jobTitle ?? '',
    departmentId: u.departmentId ?? '',
    specialties: u.specialties ? (JSON.parse(u.specialties) as string[]) : [],
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) onSaved();
    else alert('❌ ' + (data.error || 'Lỗi'));
  }

  if (!editing) {
    return (
      <tr>
        <td className="font-mono text-xs">{u.email}</td>
        <td>
          <div className="font-medium">{u.fullName}</div>
          {u.jobTitle && <div className="text-xs text-slate-500">{u.jobTitle}</div>}
        </td>
        <td><span className="badge-primary">{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || u.role}</span></td>
        <td className="text-xs">
          {u.department && <div>{u.department}</div>}
          {u.specialties && (
            <div className="text-slate-500">
              {JSON.parse(u.specialties).map((s: string) => SPECIALTY_LABELS[s as keyof typeof SPECIALTY_LABELS] || s).join(', ')}
            </div>
          )}
        </td>
        <td>
          <span className={u.isActive ? 'badge-success' : 'badge-danger'}>
            {u.isActive ? '● Hoạt động' : '✕ Khóa'}
          </span>
        </td>
        <td className="text-right">
          <div className="inline-flex gap-1">
            <button onClick={onEdit} className="px-2 py-1 text-brand-600 hover:bg-brand-50 rounded text-xs" title="Sửa thông tin & vai trò">✏️ Sửa</button>
            <button onClick={onResetPass} className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs" title="Đổi mật khẩu">🔑</button>
            <button onClick={onToggle} className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs" title={u.isActive ? 'Khóa' : 'Mở khóa'}>
              {u.isActive ? '🔒' : '🔓'}
            </button>
            <button onClick={onDelete} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs" title="Xóa">🗑️</button>
          </div>
        </td>
      </tr>
    );
  }

  // Inline edit row
  return (
    <tr className="bg-amber-50/50">
      <td colSpan={6} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><label className="label">Email</label>
            <input className="input" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value.toLowerCase() })} />
          </div>
          <div><label className="label">Họ tên</label>
            <input className="input" value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} />
          </div>
          <div><label className="label">Vai trò</label>
            <select className="input" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}>
              {ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
            </select>
          </div>
          <div className="md:col-span-2"><label className="label">Chức danh (hiển thị khi ký)</label>
            <input className="input" value={draft.jobTitle} onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })}
              placeholder="VD: BS CKI Nội khoa..." />
          </div>
          <div><label className="label">Khoa / Phòng</label>
            <select className="input" value={draft.departmentId} onChange={(e) => setDraft({ ...draft, departmentId: e.target.value })}>
              <option value="">— Không —</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          {draft.role === 'DOCTOR' && (
            <div className="md:col-span-3">
              <label className="label">Chuyên khoa khám được (cho bác sĩ)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1 bg-white p-2 rounded border border-slate-200 max-h-40 overflow-auto">
                {ALL_SPECIALTIES.map((s) => (
                  <label key={s} className="text-sm flex items-center gap-2">
                    <input type="checkbox" checked={draft.specialties.includes(s)}
                      onChange={(e) => setDraft({
                        ...draft,
                        specialties: e.target.checked
                          ? [...draft.specialties, s]
                          : draft.specialties.filter((x) => x !== s),
                      })} />
                    {SPECIALTY_LABELS[s]}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-3 justify-end">
          <button onClick={onCancelEdit} className="btn-secondary text-sm">Hủy</button>
          <button onClick={save} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
          </button>
        </div>
      </td>
    </tr>
  );
}
