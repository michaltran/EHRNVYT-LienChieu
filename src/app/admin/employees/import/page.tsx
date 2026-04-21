'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';

type Row = {
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  birthYear?: number | null;
  department: string;
  position?: string | null;
  qualification?: string | null;
  jobTitle?: string | null;
  employmentType?: string | null;
};

export default function ImportExcelPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result;
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
      const parsed = parseRows(raw);
      setRows(parsed);
      setMsg(`Đọc được ${parsed.length} nhân viên từ file. Kiểm tra bên dưới rồi bấm "Lưu vào hệ thống".`);
    };
    reader.readAsArrayBuffer(file);
  }

  // Phân tích cấu trúc giống file mẫu TTYT Liên Chiểu
  function parseRows(raw: any[][]): Row[] {
    const out: Row[] = [];
    let currentDept: string | null = null;
    for (let i = 0; i < raw.length; i++) {
      const r = raw[i];
      if (!r) continue;
      const stt = r[0];
      const name = (r[2] ?? '').toString().trim();
      const nsNam = r[3];
      const nsNu = r[4];

      if ((stt === null || stt === undefined) && name && !nsNam && !nsNu) {
        currentDept = name;
        continue;
      }
      if (!name || !currentDept) continue;
      if (typeof stt !== 'number') continue;

      const gender: Row['gender'] = nsNam ? 'MALE' : nsNu ? 'FEMALE' : 'OTHER';
      const birthYear = typeof nsNam === 'number' ? nsNam : typeof nsNu === 'number' ? nsNu : null;

      let employmentType: string | null = null;
      if (r[9]) employmentType = 'Viên chức';
      else if (r[10]) employmentType = 'HĐ 68';
      else if (r[11]) employmentType = 'Trong chỉ tiêu';
      else if (r[12]) employmentType = 'HĐ thỏa thuận';

      out.push({
        fullName: name,
        gender,
        birthYear,
        department: currentDept,
        position: (r[7] ?? '').toString().trim() || null,
        qualification: (r[13] ?? '').toString().trim() || null,
        jobTitle: (r[14] ?? '').toString().trim() || null,
        employmentType,
      });
    }
    return out;
  }

  async function save() {
    if (rows.length === 0) return;
    setLoading(true); setMsg('');
    try {
      const res = await fetch('/api/admin/employees/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu');
      setMsg(`✅ Đã tạo ${data.created} nhân viên mới, cập nhật ${data.updated || 0} (trùng tên).`);
      setTimeout(() => router.push('/admin/employees'), 1500);
    } catch (e: any) {
      setMsg('❌ ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Import Excel nhân sự</h1>

      <div className="card">
        <p className="text-sm text-slate-600 mb-3">
          Upload file Excel theo mẫu <strong>DANH SÁCH VIÊN CHỨC VÀ NGƯỜI LAO ĐỘNG</strong>. Hệ thống sẽ tự động nhận diện khoa/phòng, giới tính (qua cột năm sinh Nam/Nữ) và loại hợp đồng.
        </p>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFile}
          className="block text-sm"
        />
        {filename && <p className="text-xs text-slate-500 mt-2">📄 {filename}</p>}
      </div>

      {msg && <div className="card bg-blue-50 border-blue-200 text-sm">{msg}</div>}

      {rows.length > 0 && (
        <>
          <div className="card p-0 overflow-auto max-h-96">
            <table className="table-simple">
              <thead>
                <tr>
                  <th>STT</th><th>Họ tên</th><th>Giới</th><th>Năm sinh</th>
                  <th>Khoa/Phòng</th><th>Chức vụ</th><th>Loại HĐ</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td className="font-medium">{r.fullName}</td>
                    <td>{r.gender === 'MALE' ? 'Nam' : r.gender === 'FEMALE' ? 'Nữ' : ''}</td>
                    <td>{r.birthYear ?? ''}</td>
                    <td>{r.department}</td>
                    <td>{r.position}</td>
                    <td>{r.employmentType}</td>
                  </tr>
                ))}
                {rows.length > 50 && (
                  <tr><td colSpan={7} className="text-center text-xs text-slate-500 py-3">
                    ... và {rows.length - 50} dòng khác
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button onClick={save} disabled={loading} className="btn-primary">
              {loading ? 'Đang lưu...' : `Lưu ${rows.length} nhân viên vào hệ thống`}
            </button>
            <button onClick={() => setRows([])} className="btn-secondary">Hủy</button>
          </div>
        </>
      )}
    </div>
  );
}
