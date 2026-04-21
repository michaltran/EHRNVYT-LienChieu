'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SignaturePad from '@/components/SignaturePad';
import { SPECIALTY_LABELS, ALL_SPECIALTIES, formatDate, calcBmi } from '@/lib/constants';
import type { Specialty } from '@prisma/client';

type ExamItem = {
  specialty: Specialty;
  findings: string | null;
  classification: string | null;
  extraData: string | null;
  signedAt: string | null;
  signatureDataUrl: string | null;
  doctorName: string | null;
};

type Props = {
  record: {
    id: string;
    employee: {
      fullName: string; gender: string; dateOfBirth: string | null;
      department: string; position: string | null; photoUrl: string | null;
    };
    roundName: string;
    height: number | null; weight: number | null; bmi: number | null;
    pulse: number | null; bpSys: number | null; bpDia: number | null;
    physicalClassification: string | null;
    medicalHistoryNote: string | null;
    obstetricHistory: string | null;
    clinicalExams: ExamItem[];
  };
  mySpecialties: Specialty[];
  savedSignature: string | null;
};

export default function DoctorExamForm({ record, mySpecialties, savedSignature }: Props) {
  const router = useRouter();
  const [activeSpec, setActiveSpec] = useState<Specialty | null>(mySpecialties[0] ?? null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Thể lực (ai cũng có thể cập nhật lần đầu)
  const [vitals, setVitals] = useState({
    height: record.height ?? '',
    weight: record.weight ?? '',
    pulse: record.pulse ?? '',
    bpSys: record.bpSys ?? '',
    bpDia: record.bpDia ?? '',
    physicalClassification: record.physicalClassification ?? '',
  });
  const bmi = calcBmi(Number(vitals.height) || null, Number(vitals.weight) || null);

  // Dữ liệu khám chuyên khoa hiện tại
  const existing = record.clinicalExams.find((e) => e.specialty === activeSpec);
  const [exam, setExam] = useState({
    findings: existing?.findings ?? '',
    classification: existing?.classification ?? '',
  });
  const [signature, setSignature] = useState<string | null>(existing?.signatureDataUrl ?? null);

  async function saveVitals() {
    setLoading(true); setMsg('');
    const res = await fetch(`/api/doctor/records/${record.id}/vitals`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...vitals, bmi }),
    });
    setLoading(false);
    setMsg(res.ok ? '✅ Đã lưu thể lực' : '❌ Lỗi lưu thể lực');
  }

  async function saveExam() {
    if (!activeSpec) return;
    if (!signature) { setMsg('❌ Vui lòng ký trước khi lưu'); return; }
    setLoading(true); setMsg('');
    const res = await fetch(`/api/doctor/records/${record.id}/exam`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        specialty: activeSpec,
        findings: exam.findings,
        classification: exam.classification,
        signatureDataUrl: signature,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMsg('✅ Đã lưu & ký ' + SPECIALTY_LABELS[activeSpec]);
      router.refresh();
    } else setMsg('❌ ' + (data.error || 'Lỗi'));
  }

  // Hàm chọn chuyên khoa khác
  function switchSpec(s: Specialty) {
    const ex = record.clinicalExams.find((e) => e.specialty === s);
    setActiveSpec(s);
    setExam({ findings: ex?.findings ?? '', classification: ex?.classification ?? '' });
    setSignature(ex?.signatureDataUrl ?? null);
    setMsg('');
  }

  return (
    <div className="space-y-4">
      <Link href="/doctor" className="text-sm text-slate-500 hover:underline">← Hàng đợi</Link>

      <div className="card flex gap-4 items-start">
        {record.employee.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={record.employee.photoUrl} alt="" className="w-24 h-28 object-cover rounded border" />
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">{record.employee.fullName}</h1>
          <p className="text-sm text-slate-600">
            {record.employee.department} •{' '}
            {record.employee.gender === 'MALE' ? 'Nam' : 'Nữ'} •{' '}
            {record.employee.dateOfBirth && `Sinh năm ${new Date(record.employee.dateOfBirth).getFullYear()}`} •{' '}
            {record.employee.position}
          </p>
          <p className="text-xs text-slate-500 mt-1">Đợt: {record.roundName}</p>
        </div>
      </div>

      {msg && <div className="card bg-blue-50 border-blue-200 text-sm">{msg}</div>}

      {/* II. Thể lực */}
      <div className="card">
        <h2 className="font-semibold mb-3">II. Khám thể lực</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <div><label className="label">Chiều cao (cm)</label>
            <input type="number" className="input" value={vitals.height}
              onChange={(e) => setVitals({ ...vitals, height: e.target.value })} /></div>
          <div><label className="label">Cân nặng (kg)</label>
            <input type="number" step="0.1" className="input" value={vitals.weight}
              onChange={(e) => setVitals({ ...vitals, weight: e.target.value })} /></div>
          <div><label className="label">BMI</label>
            <input className="input bg-slate-50" value={bmi ?? ''} readOnly /></div>
          <div><label className="label">Mạch (l/ph)</label>
            <input type="number" className="input" value={vitals.pulse}
              onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })} /></div>
          <div><label className="label">HA tâm thu</label>
            <input type="number" className="input" value={vitals.bpSys}
              onChange={(e) => setVitals({ ...vitals, bpSys: e.target.value })} /></div>
          <div><label className="label">HA tâm trương</label>
            <input type="number" className="input" value={vitals.bpDia}
              onChange={(e) => setVitals({ ...vitals, bpDia: e.target.value })} /></div>
          <div className="col-span-3 md:col-span-6"><label className="label">Phân loại thể lực</label>
            <input className="input" value={vitals.physicalClassification}
              onChange={(e) => setVitals({ ...vitals, physicalClassification: e.target.value })} /></div>
        </div>
        <button onClick={saveVitals} disabled={loading} className="btn-secondary mt-3">Lưu thể lực</button>
      </div>

      {/* III. Khám lâm sàng */}
      <div className="card">
        <h2 className="font-semibold mb-3">III. Khám lâm sàng</h2>

        <div className="flex gap-2 flex-wrap mb-4 border-b border-slate-200 pb-3">
          {ALL_SPECIALTIES.map((s) => {
            const signed = record.clinicalExams.find((e) => e.specialty === s && e.signedAt);
            const canExam = mySpecialties.includes(s);
            return (
              <button
                key={s}
                onClick={() => canExam && switchSpec(s)}
                disabled={!canExam}
                className={`text-xs px-3 py-1.5 rounded ${
                  activeSpec === s ? 'bg-brand-600 text-white' :
                  signed ? 'bg-green-100 text-green-700' :
                  canExam ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' :
                  'bg-slate-50 text-slate-400 cursor-not-allowed'
                }`}
              >
                {SPECIALTY_LABELS[s]} {signed && '✓'}
              </button>
            );
          })}
        </div>

        {activeSpec && (
          <div className="space-y-3">
            <h3 className="font-medium text-slate-700">{SPECIALTY_LABELS[activeSpec]}</h3>
            <div>
              <label className="label">Nội dung khám (khẳng định có/không có bệnh, tật)</label>
              <textarea rows={4} className="input" value={exam.findings}
                onChange={(e) => setExam({ ...exam, findings: e.target.value })}
                placeholder="Mô tả chi tiết kết quả khám, triệu chứng, dấu hiệu..." />
            </div>
            <div>
              <label className="label">Phân loại</label>
              <input className="input" value={exam.classification}
                onChange={(e) => setExam({ ...exam, classification: e.target.value })}
                placeholder="VD: Loại I, Bình thường, ..." />
            </div>

            <div>
              <label className="label">Chữ ký điện tử của bác sĩ</label>
              <SignaturePad
                value={signature}
                onChange={setSignature}
                savedSignature={savedSignature}
              />
            </div>

            <button onClick={saveExam} disabled={loading} className="btn-primary">
              {loading ? 'Đang lưu...' : 'Lưu & ký khám ' + SPECIALTY_LABELS[activeSpec]}
            </button>

            {existing?.signedAt && (
              <p className="text-xs text-green-700">
                ✓ Đã ký bởi {existing.doctorName} lúc {new Date(existing.signedAt).toLocaleString('vi-VN')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tóm tắt */}
      <div className="card">
        <h3 className="font-medium mb-2">Tiến độ khám của hồ sơ này</h3>
        <div className="text-sm space-y-1">
          {record.clinicalExams.filter((e) => e.signedAt).map((e) => (
            <div key={e.specialty} className="flex justify-between text-slate-700">
              <span>✓ {SPECIALTY_LABELS[e.specialty]}</span>
              <span className="text-xs text-slate-500">
                {e.doctorName} • {e.signedAt && new Date(e.signedAt).toLocaleString('vi-VN')}
              </span>
            </div>
          ))}
          {record.clinicalExams.filter((e) => e.signedAt).length === 0 && (
            <p className="text-slate-500">Chưa có chuyên khoa nào được ký</p>
          )}
        </div>
      </div>
    </div>
  );
}
