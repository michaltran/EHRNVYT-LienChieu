'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type D = { id: string; name: string; code: string | null; count: number };

export default function DepartmentsClient({ initial }: { initial: D[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; code: string }>({ name: '', code: '' });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch('/api/admin/departments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), code: code.trim() || null }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) { setName(''); setCode(''); router.refresh(); }
    else alert('❌ ' + (data.error || 'Lỗi'));
  }

  function startEdit(d: D) {
    setEditing(d.id);
    setEditForm({ name: d.name, code: d.code ?? '' });
  }

  async function saveEdit(id: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/departments/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editForm.name.trim(), code: editForm.code.trim() || null }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) { setEditing(null); router.refresh(); }
    else alert('❌ ' + (data.error || 'Lỗi'));
  }

  async function remove(d: D) {
    if (d.count > 0) {
      alert(`Còn ${d.count} nhân viên trong khoa này — không xóa được. Hãy chuyển/xóa nhân viên trước.`);
      return;
    }
    if (!confirm(`Xóa khoa "${d.name}"?`)) return;
    const res = await fetch(`/api/admin/departments/${d.id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
    else alert((await res.json()).error || 'Không xóa được');
  }

  return (
    <>
      <form onSubmit={add} className="card flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="label">Tên khoa/phòng</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="VD: Khoa Nội" />
        </div>
        <div className="md:w-40">
          <label className="label">Mã khoa</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} className="input" placeholder="VD: KN" />
        </div>
        <button className="btn-primary" disabled={loading}>+ Thêm</button>
      </form>

      <div className="card p-0 overflow-auto">
        <table className="table-simple">
          <thead><tr><th>#</th><th>Tên</th><th>Mã</th><th>Số NV</th><th className="text-right">Thao tác</th></tr></thead>
          <tbody>
            {initial.map((d, i) => {
              if (editing === d.id) {
                return (
                  <tr key={d.id} className="bg-amber-50/60">
                    <td>{i + 1}</td>
                    <td>
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="input"
                        autoFocus
                      />
                    </td>
                    <td>
                      <input
                        value={editForm.code}
                        onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                        className="input"
                        placeholder="(tùy chọn)"
                      />
                    </td>
                    <td>{d.count}</td>
                    <td className="text-right space-x-1">
                      <button
                        onClick={() => saveEdit(d.id)}
                        disabled={loading}
                        className="text-green-700 hover:bg-green-50 px-2 py-1 rounded text-sm border border-green-300 disabled:opacity-50"
                      >
                        💾 Lưu
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="text-slate-600 hover:bg-slate-100 px-2 py-1 rounded text-sm border border-slate-300"
                      >
                        Hủy
                      </button>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={d.id}>
                  <td>{i + 1}</td>
                  <td className="font-medium">{d.name}</td>
                  <td>
                    {d.code
                      ? <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{d.code}</span>
                      : <span className="text-slate-300 italic text-xs">—</span>}
                  </td>
                  <td>
                    <span className="badge-slate">{d.count}</span>
                  </td>
                  <td className="text-right space-x-1">
                    <button
                      onClick={() => startEdit(d)}
                      className="text-brand-600 hover:bg-brand-50 px-2 py-1 rounded text-sm"
                      title="Sửa tên + mã khoa"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => remove(d)}
                      className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm"
                      title={d.count > 0 ? 'Còn nhân viên — không xóa được' : 'Xóa khoa'}
                    >
                      🗑️ Xóa
                    </button>
                  </td>
                </tr>
              );
            })}
            {initial.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">Chưa có khoa/phòng nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
