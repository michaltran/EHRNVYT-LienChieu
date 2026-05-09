'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';
import type { RecordStatus } from '@prisma/client';

type R = {
  id: string;
  employeeName: string;
  department: string;
  roundName: string;
  status: string;
  finalClassification: string | null;
  updatedAt: string;
};

type Props = {
  records: R[];
  rounds: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  currentFilters: { round: string; status: string; dept: string; q: string };
};

export default function RecordsClient({ records, rounds, departments, currentFilters }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }
  function toggleAll() {
    if (selected.size === records.length) setSelected(new Set());
    else setSelected(new Set(records.map((r) => r.id)));
  }

  async function deleteOne(r: R) {
    if (!confirm(`Xóa hồ sơ "${r.employeeName}" thuộc đợt "${r.roundName}"?\n\n⚠️ Tất cả kết quả khám CK + CLS sẽ bị xóa theo. Hành động không khôi phục được.`)) return;
    setDeleting(r.id);
    const res = await fetch(`/api/admin/records/${r.id}`, { method: 'DELETE' });
    const data = await res.json();
    setDeleting(null);
    if (res.ok) {
      const next = new Set(selected); next.delete(r.id); setSelected(next);
      router.refresh();
    } else alert('❌ ' + (data.error || 'Lỗi'));
  }

  async function deleteBulk() {
    if (selected.size === 0) return;
    const names = records.filter((r) => selected.has(r.id)).slice(0, 5).map((r) => r.employeeName).join(', ');
    const more = selected.size > 5 ? `, +${selected.size - 5} hồ sơ khác` : '';
    if (!confirm(`Xóa ${selected.size} hồ sơ: ${names}${more}?\n\n⚠️ Toàn bộ kết quả khám CK + CLS bị xóa theo.`)) return;
    setBulkLoading(true);
    const res = await fetch('/api/admin/records/bulk', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    const data = await res.json();
    setBulkLoading(false);
    if (res.ok) {
      alert(`✅ ${data.message}`);
      setSelected(new Set());
      router.refresh();
    } else alert('❌ ' + (data.error || 'Lỗi'));
  }

  async function deleteRound() {
    if (!currentFilters.round) {
      alert('Hãy chọn 1 đợt khám trong filter trước');
      return;
    }
    const round = rounds.find((r) => r.id === currentFilters.round);
    if (!confirm(`Xóa TOÀN BỘ hồ sơ thuộc đợt "${round?.name}"?\n\n⚠️ Đợt khám vẫn còn, chỉ xóa hồ sơ. Bao gồm kết quả khám + CLS.`)) return;
    setBulkLoading(true);
    const res = await fetch('/api/admin/records/bulk', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundId: currentFilters.round }),
    });
    const data = await res.json();
    setBulkLoading(false);
    if (res.ok) {
      alert(`✅ ${data.message}`);
      router.refresh();
    } else alert('❌ ' + (data.error || 'Lỗi'));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-slate-800">Hồ sơ khám sức khỏe</h1>
        {currentFilters.round && (
          <button onClick={deleteRound} disabled={bulkLoading}
            className="text-sm text-red-700 hover:bg-red-50 px-3 py-1.5 rounded border border-red-300 transition disabled:opacity-50">
            🗑️ Xóa toàn bộ hồ sơ trong đợt này
          </button>
        )}
      </div>

      <form className="card grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="label">Đợt khám</label>
          <select name="round" defaultValue={currentFilters.round} className="input">
            <option value="">-- Tất cả --</option>
            {rounds.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Trạng thái</label>
          <select name="status" defaultValue={currentFilters.status} className="input">
            <option value="">-- Tất cả --</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Khoa / Phòng</label>
          <select name="dept" defaultValue={currentFilters.dept} className="input">
            <option value="">-- Tất cả --</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Tìm tên NV</label>
          <input name="q" defaultValue={currentFilters.q} className="input" />
        </div>
        <div className="md:col-span-4">
          <button className="btn-primary">Lọc</button>
        </div>
      </form>

      {selected.size > 0 && (
        <div className="card bg-amber-50 border-amber-300 flex items-center justify-between flex-wrap gap-2 sticky top-2 z-20">
          <div className="text-sm">
            <strong>Đã chọn {selected.size} hồ sơ</strong>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSelected(new Set())} className="btn-secondary text-sm">Bỏ chọn</button>
            <button onClick={deleteBulk} disabled={bulkLoading} className="btn-danger text-sm">
              {bulkLoading ? 'Đang xóa...' : `🗑️ Xóa ${selected.size} hồ sơ đã chọn`}
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
                  checked={selected.size > 0 && selected.size === records.length}
                  ref={(el) => { if (el) el.indeterminate = selected.size > 0 && selected.size < records.length; }}
                  onChange={toggleAll}
                  className="cursor-pointer"
                />
              </th>
              <th>Nhân viên</th><th>Khoa</th><th>Đợt</th><th>Trạng thái</th>
              <th>Phân loại</th><th>Cập nhật</th><th className="text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className={selected.has(r.id) ? 'bg-amber-50/60' : ''}>
                <td onClick={(ev) => ev.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    className="cursor-pointer"
                  />
                </td>
                <td className="font-medium">{r.employeeName}</td>
                <td>{r.department}</td>
                <td className="text-xs">{r.roundName}</td>
                <td>
                  <span className={`badge ${STATUS_COLORS[r.status as RecordStatus]}`}>
                    {STATUS_LABELS[r.status as RecordStatus]}
                  </span>
                </td>
                <td>{r.finalClassification?.replace('LOAI_', 'Loại ') ?? '—'}</td>
                <td className="text-xs text-slate-500">{new Date(r.updatedAt).toLocaleString('vi-VN')}</td>
                <td className="text-right space-x-2">
                  <Link href={`/admin/records/${r.id}`} className="text-brand-600 hover:underline text-sm">
                    Chi tiết →
                  </Link>
                  <button
                    onClick={() => deleteOne(r)}
                    disabled={deleting === r.id}
                    className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm disabled:opacity-50 transition"
                  >
                    {deleting === r.id ? '...' : '🗑️ Xóa'}
                  </button>
                </td>
              </tr>
            ))}
            {records.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-slate-500">Không có hồ sơ</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
