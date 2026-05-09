import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { SPECIALTY_LABELS, CLASSIFICATION_LABELS, formatDate } from '@/lib/constants';
import PrintButton from './print-button';
import BackButton from '@/components/BackButton';
import type { Metadata } from 'next';

function vnToAscii(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // bỏ dấu thanh combining marks
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60);
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const r = await prisma.healthRecord.findUnique({
    where: { id: params.id },
    select: { employee: { select: { fullName: true } }, examRound: { select: { year: true } } },
  });
  if (!r) return { title: 'So_KSK' };
  const safeName = vnToAscii(r.employee.fullName);
  return {
    title: `So_KSK_${safeName}_${r.examRound.year}`,
    // Override metadataBase fallback nếu có
  };
}

// Parse extraData an toàn
function parseExtra(json: string | null | undefined): any {
  if (!json) return {};
  try { return JSON.parse(json); } catch { return {}; }
}

function parseSig(raw?: string | null): { image: string | null; caHash: string | null } {
  if (!raw) return { image: null, caHash: null };
  if (raw.startsWith('CA:')) {
    const sep = raw.indexOf('|||IMG:');
    if (sep > 0) return { caHash: raw.slice(3, sep), image: raw.slice(sep + 7) };
    return { caHash: raw.slice(3), image: null };
  }
  return { caHash: null, image: raw };
}

// Render chữ ký bác sĩ trong ô bảng (ảnh nhỏ + tên + chức danh + thời gian)
function CellSignature({ ex }: { ex: any }) {
  if (!ex?.signatureDataUrl && !ex?.doctorNameSnapshot) return null;
  const time = ex.signedAt ? new Date(ex.signedAt) : null;
  const { image, caHash } = parseSig(ex.signatureDataUrl);

  return (
    <div className="text-center">
      <div className="flex flex-col items-center gap-0.5">
        {image && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={image} alt="" style={{ maxHeight: 40 }} />
        )}
        {caHash && (
          <div className="inline-block border border-green-600 bg-green-50 rounded px-1.5 py-0.5 text-[8px] text-green-800 font-bold leading-tight">
            ✓ SmartCA
            <span className="font-mono block opacity-70">#{caHash.slice(0, 10)}…</span>
          </div>
        )}
      </div>
      <div className="text-xs font-medium">{ex.doctorNameSnapshot ?? ex.doctor?.fullName}</div>
      {(ex.doctorTitleSnapshot ?? ex.doctor?.jobTitle) && (
        <div className="text-[10px] text-slate-600 italic">{ex.doctorTitleSnapshot ?? ex.doctor?.jobTitle}</div>
      )}
      {time && (
        <div className="text-[10px] text-slate-500">
          {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
          {time.toLocaleDateString('vi-VN')}
        </div>
      )}
    </div>
  );
}

export default async function PrintRecord({ params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) redirect('/login');

  const record = await prisma.healthRecord.findUnique({
    where: { id: params.id },
    include: {
      employee: { include: { department: true } },
      examRound: true,
      clinicalExams: { include: { doctor: { select: { fullName: true, jobTitle: true } } } },
      paraclinicals: true,
      concluder: { select: { fullName: true, jobTitle: true } },
    },
  });
  if (!record) notFound();

  const exMap = Object.fromEntries(record.clinicalExams.map((e) => [e.specialty, e]));
  const isFemale = record.employee.gender === 'FEMALE';
  const dob = record.employee.dateOfBirth;
  const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : '';
  const obst = parseExtra(record.obstetricHistory);

  // Parse extra data từng chuyên khoa
  const matX = parseExtra(exMap['MAT']?.extraData);
  const tmhX = parseExtra(exMap['TAI_MUI_HONG']?.extraData);
  const rhmX = parseExtra(exMap['RANG_HAM_MAT']?.extraData);

  const noiList = ['NOI_TUAN_HOAN','NOI_HO_HAP','NOI_TIEU_HOA','NOI_THAN_TIET_NIEU','NOI_TIET','CO_XUONG_KHOP','THAN_KINH','TAM_THAN'] as const;
  const noiLabels: Record<string, string> = {
    NOI_TUAN_HOAN: 'Tuần hoàn', NOI_HO_HAP: 'Hô hấp', NOI_TIEU_HOA: 'Tiêu hóa',
    NOI_THAN_TIET_NIEU: 'Thận-Tiết niệu', NOI_TIET: 'Nội tiết',
    CO_XUONG_KHOP: 'Cơ - xương - khớp', THAN_KINH: 'Thần kinh', TAM_THAN: 'Tâm thần',
  };

  const personalHist = (() => {
    try { return record.employee.personalHistory ? JSON.parse(record.employee.personalHistory) : []; }
    catch { return []; }
  })();

  return (
    <div className="bg-white">
      <style>{`
        /* A4 + Book layout (double-sided) */
        @page { size: A4; margin: 15mm; }
        @page :left  { margin-left: 15mm; margin-right: 22mm; }   /* trang trái: lề ngoài rộng để đóng quyển */
        @page :right { margin-left: 22mm; margin-right: 15mm; }   /* trang phải */
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { box-shadow: none !important; }
          .page-break { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
          /* Ẩn viền các ô chữ ký khi in giấy */
          .sig-cell, .sig-cell td, table.sig-table, table.sig-table td {
            border: none !important;
          }
        }
        .sig-cell { min-height: 90px; }
      `}</style>

      <div className="no-print bg-slate-100 p-3 flex justify-between items-center sticky top-0 z-10 border-b">
        <BackButton />
        <div className="flex gap-2">
          <a
            href={`/records/${params.id}/book`}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm font-medium"
          >
            📖 Xem dạng quyển sách
          </a>
          <PrintButton docTitle={`So_KSK_${vnToAscii(record.employee.fullName)}_${record.examRound.year}`} />
        </div>
      </div>

      <div className="print-page mx-auto" style={{
        maxWidth: '210mm', padding: '15mm',
        fontFamily: 'Times New Roman, serif', fontSize: '13pt', lineHeight: 1.5,
      }}>
        {/* TRANG 1: HÀNH CHÍNH */}
        <div className="text-center">
          <div className="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div className="font-bold">Độc lập - Tự do - Hạnh phúc</div>
          <div>---------------</div>
        </div>
        <div className="text-right italic text-sm mt-2">Mẫu số 03</div>
        <h1 className="text-center font-bold text-xl mt-4 mb-6">SỔ KHÁM SỨC KHỎE ĐỊNH KỲ</h1>

        <table className="w-full border border-black text-sm" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td className="border border-black p-2 align-top text-center" style={{ width: '28%' }}>
                {record.employee.photoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={record.employee.photoUrl} alt="" style={{ width: '4cm', height: '6cm', objectFit: 'cover', margin: '0 auto' }} />
                ) : (
                  <div style={{ width: '4cm', height: '6cm', border: '1px dashed #888', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#888' }}>
                    Ảnh 4 x 6 cm
                  </div>
                )}
              </td>
              <td className="border border-black p-3 align-top">
                <p>1. Họ và tên <em>(viết chữ in hoa)</em>: <strong>{record.employee.fullName.toUpperCase()}</strong></p>
                <p>2. Giới tính: Nam {record.employee.gender === 'MALE' ? '☑' : '☐'} &nbsp;&nbsp; Nữ {isFemale ? '☑' : '☐'}</p>
                <p>3. Sinh ngày: {dob ? formatDate(dob) : '...................'} &nbsp;&nbsp; (Tuổi: {age})</p>
                <p>4. Số CCCD/CMND/Định danh: {record.employee.idNumber ?? '......................................'}</p>
                <p>5. Cấp ngày: {record.employee.idIssuedDate ? formatDate(record.employee.idIssuedDate) : '.........../............/................'} &nbsp; Tại: {record.employee.idIssuedPlace ?? '......................................'}</p>
                <p>6. Chỗ ở hiện tại: {record.employee.currentAddress ?? '.....................................................'}</p>
                <p>Số điện thoại: {record.employee.phone ?? '...........................'}</p>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 space-y-2">
          <p><strong>7. Nghề nghiệp:</strong> {record.employee.occupation ?? '......................................................................'}</p>
          <p><strong>8. Nơi công tác, học tập:</strong> {record.employee.workplace ?? '...........................................................'}</p>
          <p><strong>9. Ngày bắt đầu vào làm việc tại đơn vị hiện nay:</strong> {record.employee.startWorkingDate ? formatDate(record.employee.startWorkingDate) : '............/........../..................'}</p>
          <p><strong>10. Nghề, công việc trước đây</strong> (10 năm gần đây):</p>
          <div className="pl-4 text-sm min-h-[3em]">
            {(() => {
              try {
                const jobs = record.employee.previousJobs ? JSON.parse(record.employee.previousJobs) : [];
                if (Array.isArray(jobs) && jobs.length > 0) {
                  return (
                    <ol className="list-[lower-alpha] list-inside">
                      {jobs.slice(0, 2).map((j: any, i: number) => (
                        <li key={i}>{j.moTa || '...'} — thời gian: {j.thoiGian || '...'} — từ {j.tuNgay ?? '.../.../....'} đến {j.denNgay ?? '.../.../....'}</li>
                      ))}
                    </ol>
                  );
                }
              } catch {}
              return <div>a) ............................................................................................<br/>b) ............................................................................................</div>;
            })()}
          </div>
          <p><strong>11. Tiền sử bệnh, tật của gia đình:</strong></p>
          <div className="border-b border-dashed border-slate-400 min-h-[3em] whitespace-pre-wrap px-2">
            {record.employee.familyHistory ?? ''}
          </div>
        </div>

        <p className="mt-4"><strong>12. Tiền sử bệnh, tật của bản thân:</strong></p>
        <table className="w-full border border-black text-sm mt-1" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th className="border border-black p-1" style={{ width: '35%' }}>Tên bệnh</th>
              <th className="border border-black p-1" style={{ width: '15%' }}>Phát hiện năm</th>
              <th className="border border-black p-1" style={{ width: '35%' }}>Tên bệnh nghề nghiệp</th>
              <th className="border border-black p-1" style={{ width: '15%' }}>Phát hiện năm</th>
            </tr>
          </thead>
          <tbody>
            {['a','b','c','d'].map((letter, i) => {
              const row = personalHist[i] || {};
              return (
                <tr key={letter}>
                  <td className="border border-black p-1 h-6">{letter}) {row.tenBenh ?? ''}</td>
                  <td className="border border-black p-1 text-center">{row.namPhatHien ?? ''}</td>
                  <td className="border border-black p-1">{letter}) {row.tenBenhNgheNghiep ?? ''}</td>
                  <td className="border border-black p-1 text-center">{row.namPhatHienNN ?? ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Chữ ký NLĐ + Người lập sổ */}
        <table className="w-full sig-table text-sm mt-4 avoid-break" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td className="sig-cell p-3 align-top text-center" style={{ width: '50%' }}>
                <div className="font-bold">Người lao động xác nhận</div>
                <div className="italic text-xs">(Ký và ghi rõ họ, tên)</div>
                <div style={{ minHeight: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {record.employeeSignatureDataUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={record.employeeSignatureDataUrl} alt="" style={{ maxHeight: 60 }} />
                  )}
                </div>
                <div className="font-semibold">{record.employee.fullName}</div>
                {record.employeeSignedAt && (
                  <div className="text-xs text-slate-500">
                    Ký lúc {new Date(record.employeeSignedAt).toLocaleString('vi-VN')}
                  </div>
                )}
              </td>
              <td className="sig-cell p-3 align-top text-center">
                <div className="italic text-xs">
                  {record.bookMakerSignedAt
                    ? formatDate(record.bookMakerSignedAt)
                    : '......, ngày..... tháng..... năm...........'}
                </div>
                <div className="font-bold mt-1">Người lập sổ KSK định kỳ</div>
                <div className="italic text-xs">(Ký và ghi rõ họ, tên)</div>
                <div style={{ minHeight: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {record.bookMakerSignatureDataUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={record.bookMakerSignatureDataUrl} alt="" style={{ maxHeight: 60 }} />
                  )}
                </div>
                <div className="font-semibold">{record.bookMakerName ?? ''}</div>
                {record.bookMakerTitle && <div className="text-xs italic">{record.bookMakerTitle}</div>}
              </td>
            </tr>
          </tbody>
        </table>

        {/* TRANG 2: KHÁM SK */}
        <div className="mt-6" style={{ pageBreakBefore: 'always' }}>
          <h2 className="text-center font-bold text-lg mb-4">KHÁM SỨC KHỎE ĐỊNH KỲ</h2>

          <h3 className="font-bold">I. TIỀN SỬ BỆNH, TẬT</h3>
          <p className="italic text-sm">(Bác sỹ khám sức khỏe hỏi và ghi chép)</p>
          <div className="border-b border-dashed border-slate-400 mt-2 min-h-[4em] whitespace-pre-wrap px-2">
            {record.medicalHistoryNote ?? ''}
          </div>

          {isFemale && (
            <div className="mt-4">
              <div className="font-semibold italic">Tiền sử sản phụ khoa (đối với nữ):</div>
              <div className="pl-2 text-sm space-y-1 mt-1">
                <p>- Bắt đầu thấy kinh nguyệt năm bao nhiêu tuổi: <strong>{obst.kinhNguyet ?? '.......'}</strong></p>
                <p>- Tính chất kinh nguyệt: Đều {obst.tinhChat === 'Đều' ? '☑' : '☐'} Không đều {obst.tinhChat === 'Không đều' ? '☑' : '☐'}</p>
                <p>- Chu kỳ kinh: <strong>{obst.chuKy ?? '......'}</strong> ngày; Lượng kinh: <strong>{obst.luongKinh ?? '......'}</strong> ngày</p>
                <p>- Đau bụng kinh: Có {obst.dauBung === 'Có' ? '☑' : '☐'} Không {obst.dauBung === 'Không' ? '☑' : '☐'}</p>
                <p>- Đã lập gia đình: Có {obst.lapGiaDinh === 'Có' ? '☑' : '☐'} Chưa {obst.lapGiaDinh === 'Chưa' ? '☑' : '☐'}</p>
                <p>- PARA: <strong>{obst.para ?? '......'}</strong></p>
                <p>- Số lần mổ sản, phụ khoa: <strong>{obst.moSan ?? 'Chưa'}</strong></p>
                <p>- BPTT đang áp dụng: <strong>{obst.bptt ?? 'Không'}</strong></p>
              </div>
            </div>
          )}

          <h3 className="font-bold mt-4">II. KHÁM THỂ LỰC</h3>
          <p>Chiều cao: <strong>{record.height ?? '........'}</strong> cm; Cân nặng: <strong>{record.weight ?? '........'}</strong> kg; Chỉ số BMI: <strong>{record.bmi ?? '........'}</strong></p>
          <p>Mạch: <strong>{record.pulse ?? '........'}</strong> lần/phút; Huyết áp: <strong>{record.bloodPressureSys ?? '........'}</strong>/<strong>{record.bloodPressureDia ?? '........'}</strong> mmHg</p>
          <p>Phân loại thể lực: <em>{record.physicalClassification ?? ''}</em></p>

          <h3 className="font-bold mt-4">III. KHÁM LÂM SÀNG</h3>
          <table className="w-full border border-black text-sm mt-2" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className="border border-black p-1 text-left" style={{ width: '60%' }}>Nội dung khám</th>
                <th className="border border-black p-1 text-left">Họ tên và chữ ký BS chuyên khoa</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={2} className="border border-black p-1 font-bold bg-slate-50">1. Nội khoa</td></tr>
              {noiList.map((sp, idx) => {
                const ex = exMap[sp];
                const letter = ['a','b','c','d','đ','e','g','h'][idx];
                return (
                  <tr key={sp}>
                    <td className="border border-black p-2">
                      <span className="italic">{letter}) {noiLabels[sp]}</span>
                      <div className="min-h-[1.2em] whitespace-pre-wrap pl-4">{ex?.findings ?? ''}</div>
                      <div className="text-xs pl-4">Phân loại: {ex?.classification ?? ''}</div>
                    </td>
                    <td className="border border-black p-2 align-middle">
                      <CellSignature ex={ex} />
                    </td>
                  </tr>
                );
              })}

              <tr>
                <td className="border border-black p-2">
                  <strong>2. Ngoại khoa, Da liễu:</strong>
                  <div className="pl-3">
                    <div>- Ngoại khoa: {exMap['NGOAI_KHOA']?.findings ?? ''}</div>
                    <div className="text-xs">Phân loại: {exMap['NGOAI_KHOA']?.classification ?? ''}</div>
                    <div className="mt-1">- Da liễu: {exMap['DA_LIEU']?.findings ?? ''}</div>
                    <div className="text-xs">Phân loại: {exMap['DA_LIEU']?.classification ?? ''}</div>
                  </div>
                </td>
                <td className="border border-black p-2 align-middle">
                  <CellSignature ex={exMap['NGOAI_KHOA'] || exMap['DA_LIEU']} />
                </td>
              </tr>

              {isFemale && (
                <tr>
                  <td className="border border-black p-2">
                    <strong>3. Sản phụ khoa:</strong>
                    <div className="pl-3 whitespace-pre-wrap">{exMap['SAN_PHU_KHOA']?.findings ?? ''}</div>
                    <div className="text-xs pl-3">Phân loại: {exMap['SAN_PHU_KHOA']?.classification ?? ''}</div>
                  </td>
                  <td className="border border-black p-2 align-middle">
                    <CellSignature ex={exMap['SAN_PHU_KHOA']} />
                  </td>
                </tr>
              )}

              <tr>
                <td className="border border-black p-2">
                  <strong>4. Mắt:</strong>
                  <div className="pl-3 mt-1">
                    <div className="italic text-xs">Kết quả khám thị lực:</div>
                    <div>Không kính: Mắt phải <strong>{matX.khongKinhPhai ?? '........'}</strong> Mắt trái <strong>{matX.khongKinhTrai ?? '........'}</strong></div>
                    <div>Có kính: Mắt phải <strong>{matX.coKinhPhai ?? '........'}</strong> Mắt trái <strong>{matX.coKinhTrai ?? '........'}</strong></div>
                    <div className="mt-1 italic text-xs">Các bệnh về mắt (nếu có):</div>
                    <div className="whitespace-pre-wrap">{exMap['MAT']?.findings ?? ''}</div>
                    <div className="text-xs">Phân loại: {exMap['MAT']?.classification ?? ''}</div>
                  </div>
                </td>
                <td className="border border-black p-2 align-middle">
                  <CellSignature ex={exMap['MAT']} />
                </td>
              </tr>

              <tr>
                <td className="border border-black p-2">
                  <strong>5. Tai - Mũi - Họng:</strong>
                  <div className="pl-3 mt-1">
                    <div className="italic text-xs">Kết quả khám thính lực:</div>
                    <div>Tai trái: Nói thường <strong>{tmhX.tranTraiNoiThuong ?? '......'}</strong> m; Nói thầm <strong>{tmhX.tranTraiNoiTham ?? '......'}</strong> m</div>
                    <div>Tai phải: Nói thường <strong>{tmhX.tranPhaiNoiThuong ?? '......'}</strong> m; Nói thầm <strong>{tmhX.tranPhaiNoiTham ?? '......'}</strong> m</div>
                    <div className="mt-1 italic text-xs">Các bệnh về tai mũi họng (nếu có):</div>
                    <div className="whitespace-pre-wrap">{exMap['TAI_MUI_HONG']?.findings ?? ''}</div>
                    <div className="text-xs">Phân loại: {exMap['TAI_MUI_HONG']?.classification ?? ''}</div>
                  </div>
                </td>
                <td className="border border-black p-2 align-middle">
                  <CellSignature ex={exMap['TAI_MUI_HONG']} />
                </td>
              </tr>

              <tr>
                <td className="border border-black p-2">
                  <strong>6. Răng - Hàm - Mặt:</strong>
                  <div className="pl-3 mt-1">
                    <div>Hàm trên: <strong>{rhmX.hamTren ?? '........'}</strong></div>
                    <div>Hàm dưới: <strong>{rhmX.hamDuoi ?? '........'}</strong></div>
                    <div className="mt-1 italic text-xs">Các bệnh về răng hàm mặt (nếu có):</div>
                    <div className="whitespace-pre-wrap">{exMap['RANG_HAM_MAT']?.findings ?? ''}</div>
                    <div className="text-xs">Phân loại: {exMap['RANG_HAM_MAT']?.classification ?? ''}</div>
                  </div>
                </td>
                <td className="border border-black p-2 align-middle">
                  <CellSignature ex={exMap['RANG_HAM_MAT']} />
                </td>
              </tr>
            </tbody>
          </table>

          <h3 className="font-bold mt-4 page-break">IV. KHÁM CẬN LÂM SÀNG</h3>
          <p className="italic text-xs">Xét nghiệm huyết học, sinh hóa, X-quang, siêu âm và các CLS khác khi có chỉ định của bác sỹ:</p>
          {(() => {
            const categories = ['Công thức máu', 'Sinh hoá', 'Miễn dịch', 'Điện tim', 'Điện não', 'X-quang', 'Siêu âm', 'CT'];
            const grouped: Record<string, typeof record.paraclinicals> = {};
            for (const cat of categories) grouped[cat] = [];
            const others: typeof record.paraclinicals = [];
            for (const p of record.paraclinicals) {
              if (grouped[p.category]) grouped[p.category].push(p);
              else others.push(p);
            }
            const all = [...categories.flatMap(c => grouped[c].map(p => [c, p] as const)), ...others.map(p => [p.category, p] as const)];
            return (
              <div className="space-y-3 mt-2">
                {all.length === 0 && <p className="italic text-slate-500">Chưa có kết quả CLS nào.</p>}
                {all.map(([cat, p]) => (
                  <div key={p.id} className="avoid-break border border-black p-2 text-sm">
                    <div className="font-bold">
                      ▸ {cat}
                      {p.testName && p.testName !== cat && <span className="font-normal italic"> — {p.testName}</span>}
                    </div>
                    {p.result && (
                      <pre className="whitespace-pre-wrap font-serif text-[12pt] mt-1 leading-snug">{p.result}</pre>
                    )}
                    {p.evaluation && (
                      <div className="text-sm mt-1"><strong>Đánh giá:</strong> <em>{p.evaluation}</em></div>
                    )}
                    {p.fileUrl && (
                      <div className="text-xs italic text-slate-500 mt-1 no-print">📎 Có file đính kèm</div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}

          <h3 className="font-bold mt-4">V. KẾT LUẬN</h3>
          <p><strong>1. Phân loại sức khỏe:</strong> {record.finalClassification ? CLASSIFICATION_LABELS[record.finalClassification] : '...................................................'}</p>
          <p><strong>2. Các bệnh, tật (nếu có):</strong></p>
          <div className="border-b border-dashed border-slate-400 min-h-[4em] whitespace-pre-wrap mt-1 px-2">
            {record.conclusionText ?? ''}
          </div>

          <div className="flex justify-end mt-10 avoid-break">
            <div className="text-center sig-cell" style={{ minWidth: 280, position: 'relative' }}>
              <div className="italic text-sm">
                {record.concluderSignedAt ? formatDate(record.concluderSignedAt) : '......, ngày..... tháng..... năm...........'}
              </div>
              <div className="font-bold mt-1">NGƯỜI KẾT LUẬN</div>
              <div className="italic text-sm">(Ký, ghi rõ họ tên và đóng dấu)</div>
              <div style={{ minHeight: 70, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                {record.concluderSignedAt && (
                  /* Con dấu đỏ - đè 1/3 chữ ký bên TRÁI (chuẩn dấu hành chính VN) */
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src="/assets/images/stamp.png"
                    alt="Con dấu"
                    style={{
                      position: 'absolute',
                      width: 130, height: 130,
                      left: '5%', top: '20%',
                      opacity: 0.92,
                      pointerEvents: 'none',
                      zIndex: 2,
                      mixBlendMode: 'multiply',
                    }}
                  />
                )}
                {(() => {
                  const { image, caHash } = parseSig(record.concluderSignatureDataUrl);
                  return (
                    <>
                      {image && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={image} alt="" style={{ maxHeight: 60 }} />
                      )}
                      {caHash && (
                        <div className="border-2 border-green-600 bg-green-50 rounded px-3 py-1 text-center">
                          <div className="font-bold text-green-800 text-xs">✓ ĐÃ KÝ SỐ VNPT SmartCA</div>
                          <div className="font-mono text-[9px] text-green-700">
                            Hash: {caHash.slice(0, 28)}...
                          </div>
                          <div className="text-[9px] text-green-600 italic">
                            (Có giá trị pháp lý theo Luật GDĐT)
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="font-bold">{record.concluderNameSnapshot ?? record.concluder?.fullName ?? ''}</div>
              {(record.concluderTitleSnapshot ?? record.concluder?.jobTitle) && (
                <div className="text-xs italic">{record.concluderTitleSnapshot ?? record.concluder?.jobTitle}</div>
              )}
              {record.concluderSignedAt && (
                <div className="text-xs text-slate-500">
                  Ký lúc {new Date(record.concluderSignedAt).toLocaleString('vi-VN')}
                </div>
              )}
            </div>
          </div>

          <hr className="mt-6 border-slate-300" />
          <p className="text-xs text-slate-500 italic mt-1">
            <sup>1</sup> Phân loại sức khỏe theo quy định của Bộ Y tế.{' '}
            <sup>2</sup> Ghi rõ các bệnh, tật, phương án điều trị, phục hồi chức năng hoặc giới thiệu khám chuyên khoa (nếu có).
          </p>
          <p className="text-center text-xs text-slate-400 mt-4 italic">
            Software Copyright Powered by Dat Dat
          </p>
        </div>
      </div>
    </div>
  );
}
