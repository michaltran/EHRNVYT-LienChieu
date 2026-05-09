'use client';

import { useEffect, useState } from 'react';

type Backup = { filename: string; size: number; sizeReadable: string; createdAt: string };

export default function BackupClient() {
  const [list, setList] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function reload() {
    const res = await fetch('/api/admin/backup', { method: 'PATCH' });
    if (res.ok) {
      const data = await res.json();
      setList(data.backups || []);
    }
  }

  useEffect(() => { reload(); }, []);

  async function backupToServer() {
    setLoading(true); setMsg('');
    const res = await fetch('/api/admin/backup', { method: 'POST' });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMsg(`✅ Đã tạo backup ${data.filename} (${data.sizeReadable})`);
      reload();
    } else {
      setMsg('❌ ' + (data.error || 'Lỗi'));
    }
  }

  return (
    <div className="space-y-4">
      <div className="card-accent">
        <h2 className="font-bold text-slate-800 mb-2">📦 Sao lưu</h2>
        <p className="text-sm text-slate-600 mb-3">
          Sao lưu toàn bộ database (PostgreSQL) gồm: tài khoản, nhân viên, hồ sơ khám, kết quả CLS, audit log, giao dịch ký số.
          File output dạng <code>.sql</code>, có thể restore bằng <code>psql -d ehr_lienchieu &lt; file.sql</code>.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href="/api/admin/backup" className="btn-primary">
            ⬇️ Tải về máy ngay
          </a>
          <button onClick={backupToServer} disabled={loading} className="btn-secondary">
            {loading ? 'Đang tạo...' : '💾 Lưu vào server (./backups/)'}
          </button>
        </div>
        {msg && <div className="mt-3 text-sm">{msg}</div>}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">📋 Backup đã lưu trên server</h2>
          <button onClick={reload} className="text-sm text-slate-500 hover:underline">↻ Làm mới</button>
        </div>
        {list.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Chưa có file backup nào trên server. Bấm "Lưu vào server" để tạo.</p>
        ) : (
          <table className="table-simple">
            <thead><tr><th>Tên file</th><th>Kích thước</th><th>Thời gian</th></tr></thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.filename}>
                  <td className="font-mono text-xs">{b.filename}</td>
                  <td>{b.sizeReadable}</td>
                  <td className="text-xs text-slate-500">{new Date(b.createdAt).toLocaleString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="text-xs text-slate-500 mt-3">
          <strong>Đường dẫn server:</strong> <code>./backups/</code> trong thư mục app.
          Có thể copy file ra ổ cứng ngoài/cloud bằng PowerShell, hoặc setup Task Scheduler chạy POST /api/admin/backup định kỳ.
        </div>
      </div>

      <div className="card bg-amber-50 border-amber-200">
        <h2 className="font-bold text-amber-900 mb-2">⚠️ Hướng dẫn restore</h2>
        <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
          <li>Stop service: <code>Stop-Service EHR-LienChieu</code></li>
          <li>Restore: <code>psql -U postgres -d ehr_lienchieu -f backup.sql</code> (cần đặt PGPASSWORD trước)</li>
          <li>Start lại: <code>Start-Service EHR-LienChieu</code></li>
        </ol>
      </div>
    </div>
  );
}
