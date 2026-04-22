'use client';

import { useState } from 'react';
import SignaturePad from '@/components/SignaturePad';

export default function DoctorProfileClient({
  fullName, email, jobTitle, savedSignature,
}: { fullName: string; email: string; jobTitle: string; savedSignature: string | null }) {
  const [sig, setSig] = useState<string | null>(savedSignature);
  const [title, setTitle] = useState(jobTitle);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true); setMsg('');
    const res = await fetch('/api/doctor/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signatureDataUrl: sig, jobTitle: title }),
    });
    setLoading(false);
    setMsg(res.ok ? '✅ Đã lưu' : '❌ Lỗi');
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800">Thông tin & chữ ký</h1>

      <div className="card space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-slate-500">Họ tên</div>
            <div className="font-medium">{fullName}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Email</div>
            <div className="font-mono text-sm">{email}</div>
          </div>
        </div>
        <div>
          <label className="label">Chức danh (hiển thị khi ký)</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: BS CKI Nội khoa - Khoa Nội" />
          <p className="text-xs text-slate-500 mt-1">
            Sẽ hiển thị dưới chữ ký trong mẫu khám và trang in
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">Chữ ký điện tử mẫu</h2>
        <p className="text-sm text-slate-600 mb-3">
          Ký vào ô dưới HOẶC upload ảnh PNG chữ ký có sẵn. Chữ ký này được lưu lại và dùng lại khi ký từng nhân viên (có thể đổi nếu muốn).
        </p>
        <SignaturePad value={sig} onChange={setSig} savedSignature={null} />
      </div>

      <div className="flex gap-2">
        <button onClick={save} className="btn-primary" disabled={loading}>
          {loading ? 'Đang lưu...' : 'Lưu thông tin & chữ ký'}
        </button>
        {msg && <span className="text-sm self-center">{msg}</span>}
      </div>
    </div>
  );
}
