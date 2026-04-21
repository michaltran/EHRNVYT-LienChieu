'use client';

import { useState } from 'react';
import SignaturePad from '@/components/SignaturePad';

export default function DoctorProfileClient({
  fullName, email, savedSignature,
}: { fullName: string; email: string; savedSignature: string | null }) {
  const [sig, setSig] = useState<string | null>(savedSignature);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true); setMsg('');
    const res = await fetch('/api/doctor/signature', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signatureDataUrl: sig }),
    });
    setLoading(false);
    setMsg(res.ok ? '✅ Đã lưu chữ ký' : '❌ Lỗi');
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800">Thông tin & chữ ký</h1>

      <div className="card">
        <div className="grid grid-cols-2 gap-3">
          <div><div className="text-xs text-slate-500">Họ tên</div><div className="font-medium">{fullName}</div></div>
          <div><div className="text-xs text-slate-500">Email</div><div className="font-mono text-sm">{email}</div></div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">Chữ ký điện tử mẫu</h2>
        <p className="text-sm text-slate-600 mb-3">
          Ký 1 lần ở đây, hệ thống sẽ cho phép bạn dùng lại chữ ký này khi khám các nhân viên.
        </p>
        <SignaturePad value={sig} onChange={setSig} savedSignature={null} />
        <div className="mt-3 flex gap-2">
          <button onClick={save} className="btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu chữ ký mẫu'}
          </button>
          {msg && <span className="text-sm self-center">{msg}</span>}
        </div>
      </div>
    </div>
  );
}
