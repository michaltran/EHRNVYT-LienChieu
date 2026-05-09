'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PARACLINICAL_CATEGORIES, getTemplateFor } from '@/lib/paraclinical-templates';

function ParaclinicalFile({ fileUrl, fileName }: { fileUrl: string; fileName: string | null }) {
  const [open, setOpen] = useState(false);
  const ext = (fileName || fileUrl).split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  const isPdf = ext === 'pdf';

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded text-xs text-brand-700 font-medium transition"
      >
        <span>{isImage ? '🖼️' : isPdf ? '📄' : '📎'}</span>
        <span>{fileName || 'File đính kèm'}</span>
        <span className="text-brand-400 ml-1">{open ? '▲ Ẩn' : '▼ Xem'}</span>
      </button>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener"
        className="ml-2 text-xs text-slate-500 hover:underline"
        title="Mở trong tab mới"
      >
        ↗ Mở
      </a>

      {open && (
        <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
          {isImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={fileUrl} alt={fileName || ''} className="w-full max-h-[600px] object-contain bg-white" />
          )}
          {isPdf && (
            <iframe
              src={fileUrl}
              className="w-full"
              style={{ height: 600 }}
              title={fileName || 'PDF'}
            />
          )}
          {!isImage && !isPdf && (
            <div className="p-4 text-sm text-slate-600">
              Định dạng <code>.{ext}</code> không xem trực tiếp được.
              <a href={fileUrl} target="_blank" rel="noopener" className="text-brand-600 hover:underline ml-1">Tải về</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type Paraclinical = {
  id: string;
  category: string;
  testName: string;
  result: string | null;
  evaluation: string | null;
  note: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
};

type Props = {
  recordId: string;
  existing: Paraclinical[];
  allowedCategories?: string[];
};

export default function ParaclinicalPanel({ recordId, existing, allowedCategories }: Props) {
  const router = useRouter();
  const CATEGORIES = allowedCategories && allowedCategories.length > 0
    ? allowedCategories
    : (PARACLINICAL_CATEGORIES as readonly string[]);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [testName, setTestName] = useState('');
  const [result, setResult] = useState<string>(getTemplateFor(CATEGORIES[0]));
  const [evaluation, setEvaluation] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  function changeCategory(c: string) {
    setCategory(c);
    // Tự fill template khi đổi loại nếu textarea trống hoặc chứa template cũ
    const oldTemplate = getTemplateFor(category);
    if (!result.trim() || result.trim() === oldTemplate.trim()) {
      setResult(getTemplateFor(c));
    }
  }

  async function add() {
    setLoading(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('recordId', recordId);
      fd.append('category', category);
      fd.append('testName', testName || category);
      fd.append('result', result);
      fd.append('evaluation', evaluation);
      if (file) fd.append('file', file);

      const res = await fetch('/api/paraclinical', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi');

      setMsg('✅ Đã lưu');
      setTestName(''); setEvaluation(''); setFile(null);
      setResult(getTemplateFor(category));
      const input = document.getElementById('para-file') as HTMLInputElement;
      if (input) input.value = '';
      router.refresh();
    } catch (e: any) {
      setMsg('❌ ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Xóa mục này?')) return;
    const res = await fetch(`/api/paraclinical?id=${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
  }

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold">IV. Khám cận lâm sàng</h2>
      <p className="text-xs text-slate-600">
        Chọn loại CLS — biểu mẫu chuẩn sẽ tự xuất hiện. Có thể đính kèm PDF/ảnh kết quả scan (tối đa 10MB).
      </p>

      {existing.length > 0 && (
        <div className="space-y-2">
          {existing.map((p) => {
            const isMine = !allowedCategories || allowedCategories.includes(p.category);
            return (
              <div
                key={p.id}
                className={`border rounded p-3 ${
                  isMine ? 'border-slate-200 bg-slate-50' : 'border-slate-100 bg-white opacity-75'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {p.category}
                      {p.testName && p.testName !== p.category && <span className="text-slate-500"> — {p.testName}</span>}
                      {!isMine && <span className="ml-2 badge bg-slate-200 text-slate-600 text-[10px]">KTV khác</span>}
                    </div>
                    {p.result && (
                      <div className="text-sm mt-1">
                        <span className="text-slate-500">Kết quả:</span>
                        <pre className="whitespace-pre-wrap font-sans text-slate-700 mt-1 text-xs bg-white border rounded p-2">{p.result}</pre>
                      </div>
                    )}
                    {p.evaluation && <div className="text-sm"><span className="text-slate-500">Đánh giá:</span> <em>{p.evaluation}</em></div>}
                    {p.fileUrl && (
                      <ParaclinicalFile fileUrl={p.fileUrl} fileName={p.fileName} />
                    )}
                  </div>
                  {isMine && (
                    <button onClick={() => remove(p.id)} className="text-red-600 hover:underline text-xs">Xóa</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-6 gap-3 border-t pt-4">
        <div className="col-span-2">
          <label className="label">Loại CLS</label>
          <select className="input" value={category} onChange={(e) => changeCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-span-4">
          <label className="label">Tên xét nghiệm chi tiết (tùy chọn)</label>
          <input className="input" value={testName} onChange={(e) => setTestName(e.target.value)}
            placeholder="VD: X-quang ngực thẳng, Siêu âm ổ bụng tổng quát..." />
        </div>
        <div className="col-span-6">
          <label className="label">Kết quả (biểu mẫu chuẩn — chỉnh sửa các giá trị)</label>
          <textarea rows={10} className="input font-mono text-xs" value={result} onChange={(e) => setResult(e.target.value)} />
          <p className="text-xs text-slate-500 mt-1">💡 Mẹo: Bấm chọn loại CLS ở trên để tự nạp lại biểu mẫu chuẩn.</p>
        </div>
        <div className="col-span-6">
          <label className="label">Đánh giá tổng quát</label>
          <input className="input" value={evaluation} onChange={(e) => setEvaluation(e.target.value)}
            placeholder="Bình thường / Bất thường / ..." />
        </div>
        <div className="col-span-6">
          <label className="label">File đính kèm (PDF/JPG/PNG, tối đa 10MB)</label>
          <input id="para-file" type="file" accept=".pdf,image/*" className="block text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          {file && <p className="text-xs text-slate-500 mt-1">📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
        </div>
      </div>

      {msg && <div className="text-sm">{msg}</div>}

      <button onClick={add} disabled={loading} className="btn-primary">
        {loading ? 'Đang lưu...' : '+ Thêm kết quả CLS'}
      </button>
    </div>
  );
}
