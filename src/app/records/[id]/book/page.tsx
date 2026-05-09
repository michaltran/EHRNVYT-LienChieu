import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { CLASSIFICATION_LABELS, formatDate } from '@/lib/constants';
import BookViewer from '@/components/BookViewer';

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

function CellSig({ ex }: { ex: any }) {
  if (!ex?.signatureDataUrl && !ex?.doctorNameSnapshot) return null;
  const time = ex.signedAt ? new Date(ex.signedAt) : null;
  const { image, caHash } = parseSig(ex.signatureDataUrl);
  return (
    <div className="text-center">
      <div className="flex flex-col items-center gap-0.5">
        {image && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={image} alt="" style={{ maxHeight: 32 }} />
        )}
        {caHash && (
          <div className="inline-block border border-green-600 bg-green-50 rounded px-1 py-0.5 text-[8px] text-green-800 font-bold leading-tight">
            ✓ SmartCA
            <span className="font-mono block opacity-70">#{caHash.slice(0, 8)}…</span>
          </div>
        )}
      </div>
      <div className="text-[10px] font-medium mt-0.5">{ex.doctorNameSnapshot ?? ex.doctor?.fullName}</div>
      {(ex.doctorTitleSnapshot ?? ex.doctor?.jobTitle) && (
        <div className="text-[9px] text-slate-600 italic">{ex.doctorTitleSnapshot ?? ex.doctor?.jobTitle}</div>
      )}
      {time && (
        <div className="text-[9px] text-slate-500">
          {time.toLocaleDateString('vi-VN')}
        </div>
      )}
    </div>
  );
}

export default async function BookRecord({ params }: { params: { id: string } }) {
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
  const matX = parseExtra(exMap['MAT']?.extraData);
  const tmhX = parseExtra(exMap['TAI_MUI_HONG']?.extraData);
  const rhmX = parseExtra(exMap['RANG_HAM_MAT']?.extraData);
  const personalHist = (() => {
    try { return record.employee.personalHistory ? JSON.parse(record.employee.personalHistory) : []; }
    catch { return []; }
  })();
  const noiList = ['NOI_TUAN_HOAN','NOI_HO_HAP','NOI_TIEU_HOA','NOI_THAN_TIET_NIEU','NOI_TIET','CO_XUONG_KHOP','THAN_KINH','TAM_THAN'] as const;
  const noiLabels: Record<string, string> = {
    NOI_TUAN_HOAN: 'Tuần hoàn', NOI_HO_HAP: 'Hô hấp', NOI_TIEU_HOA: 'Tiêu hóa',
    NOI_THAN_TIET_NIEU: 'Thận-Tiết niệu', NOI_TIET: 'Nội tiết',
    CO_XUONG_KHOP: 'Cơ-Xương-Khớp', THAN_KINH: 'Thần kinh', TAM_THAN: 'Tâm thần',
  };

  // ============== BUILD PAGES ==============
  const pages: React.ReactNode[] = [];

  // PAGE 1 - COVER + Admin Info
  pages.push(
    <div>
      <div className="text-center">
        <div className="font-bold text-[12pt]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div className="font-bold text-[12pt]">Độc lập - Tự do - Hạnh phúc</div>
        <div>---------------</div>
      </div>
      <div className="text-right italic text-xs mt-1">Mẫu số 03</div>
      <h1 className="text-center font-bold text-base mt-3 mb-3">SỔ KHÁM SỨC KHỎE ĐỊNH KỲ</h1>
      <div className="text-center text-xs italic mb-3">Đợt: {record.examRound.name} ({record.examRound.year})</div>

      <table className="w-full border border-black" style={{ borderCollapse: 'collapse', fontSize: '10pt' }}>
        <tbody>
          <tr>
            <td className="border border-black p-1 align-top text-center" style={{ width: '32%' }}>
              {record.employee.photoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={record.employee.photoUrl} alt="" style={{ width: '3cm', height: '4.5cm', objectFit: 'cover', margin: '0 auto' }} />
              ) : (
                <div style={{ width: '3cm', height: '4.5cm', border: '1px dashed #888', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#888' }}>
                  Ảnh 3x4
                </div>
              )}
            </td>
            <td className="border border-black p-2 align-top text-[12pt]">
              <p>1. Họ tên: <strong>{record.employee.fullName.toUpperCase()}</strong></p>
              <p>2. Giới: {record.employee.gender === 'MALE' ? 'Nam ☑' : isFemale ? 'Nữ ☑' : ''}</p>
              <p>3. Sinh: {dob ? formatDate(dob) : '—'} (Tuổi {age})</p>
              <p>4. CCCD: {record.employee.idNumber ?? '...'}</p>
              <p>5. Địa chỉ: {record.employee.currentAddress ?? '...'}</p>
              <p>6. SĐT: {record.employee.phone ?? '...'}</p>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-2 space-y-1 text-[12pt]">
        <p><strong>7. Nghề nghiệp:</strong> {record.employee.occupation ?? '...'}</p>
        <p><strong>8. Nơi công tác:</strong> {record.employee.workplace ?? '...'}</p>
        <p><strong>9. Bắt đầu làm:</strong> {record.employee.startWorkingDate ? formatDate(record.employee.startWorkingDate) : '...'}</p>
        <p><strong>10. Khoa:</strong> {record.employee.department.name}</p>
        <p><strong>11. Tiền sử gia đình:</strong></p>
        <div className="border-b border-dashed min-h-[2em] whitespace-pre-wrap px-1 text-[11.5pt]">
          {record.employee.familyHistory ?? ''}
        </div>
      </div>
    </div>
  );

  // PAGE 2 - Personal medical history + Signatures
  pages.push(
    <div>
      <p className="font-bold text-[13pt]">12. Tiền sử bệnh, tật của bản thân:</p>
      <table className="w-full border border-black mt-1" style={{ borderCollapse: 'collapse', fontSize: '9.5pt' }}>
        <thead>
          <tr>
            <th className="border border-black p-1" style={{ width: '40%' }}>Tên bệnh</th>
            <th className="border border-black p-1" style={{ width: '10%' }}>Năm</th>
            <th className="border border-black p-1" style={{ width: '40%' }}>Bệnh nghề nghiệp</th>
            <th className="border border-black p-1" style={{ width: '10%' }}>Năm</th>
          </tr>
        </thead>
        <tbody>
          {['a','b','c','d'].map((letter, i) => {
            const row = personalHist[i] || {};
            return (
              <tr key={letter}>
                <td className="border border-black p-1 h-7">{letter}) {row.tenBenh ?? ''}</td>
                <td className="border border-black p-1 text-center">{row.namPhatHien ?? ''}</td>
                <td className="border border-black p-1">{letter}) {row.tenBenhNgheNghiep ?? ''}</td>
                <td className="border border-black p-1 text-center">{row.namPhatHienNN ?? ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <table className="w-full mt-4" style={{ borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td className="p-2 align-top text-center" style={{ width: '50%' }}>
              <div className="font-bold text-[12pt]">Người lao động xác nhận</div>
              <div className="italic text-[10pt]">(Ký, ghi rõ họ tên)</div>
              <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {record.employeeSignatureDataUrl &&
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={record.employeeSignatureDataUrl} alt="" style={{ maxHeight: 50 }} />}
              </div>
              <div className="font-semibold text-[12pt]">{record.employee.fullName}</div>
            </td>
            <td className="p-2 align-top text-center">
              <div className="italic text-[10pt]">
                {record.bookMakerSignedAt ? formatDate(record.bookMakerSignedAt) : '......, ngày..... tháng..... năm.....'}
              </div>
              <div className="font-bold mt-1 text-[12pt]">Người lập sổ</div>
              <div className="italic text-[10pt]">(Ký, ghi rõ họ tên)</div>
              <div style={{ minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {record.bookMakerSignatureDataUrl &&
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={record.bookMakerSignatureDataUrl} alt="" style={{ maxHeight: 50 }} />}
              </div>
              <div className="font-semibold text-[12pt]">{record.bookMakerName ?? ''}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  // PAGE 3 - Khám SK heading + I + II + sản phụ khoa nếu nữ
  pages.push(
    <div>
      <h2 className="text-center font-bold text-base mb-3">KHÁM SỨC KHỎE ĐỊNH KỲ</h2>

      <h3 className="font-bold text-[13pt]">I. TIỀN SỬ BỆNH, TẬT</h3>
      <div className="border-b border-dashed mt-1 min-h-[3em] whitespace-pre-wrap px-1 text-[12pt]">
        {record.medicalHistoryNote ?? ''}
      </div>

      {isFemale && (
        <div className="mt-3">
          <div className="font-semibold italic text-[12pt]">Tiền sử sản phụ khoa:</div>
          <div className="pl-2 text-[11.5pt] space-y-0.5 mt-1">
            <p>- Bắt đầu kinh nguyệt: <strong>{obst.kinhNguyet ?? '...'}</strong> tuổi</p>
            <p>- Tính chất: {obst.tinhChat ?? '...'}; Chu kỳ: <strong>{obst.chuKy ?? '...'}</strong>d; Lượng: <strong>{obst.luongKinh ?? '...'}</strong>d</p>
            <p>- Đau bụng kinh: {obst.dauBung ?? '...'}; Lập gia đình: {obst.lapGiaDinh ?? '...'}</p>
            <p>- PARA: <strong>{obst.para ?? '...'}</strong>; Mổ sản phụ khoa: {obst.moSan ?? 'Chưa'}; BPTT: {obst.bptt ?? 'Không'}</p>
          </div>
        </div>
      )}

      <h3 className="font-bold mt-3 text-[13pt]">II. KHÁM THỂ LỰC</h3>
      <p className="text-[12pt]">Cao: <strong>{record.height ?? '...'}</strong>cm; Nặng: <strong>{record.weight ?? '...'}</strong>kg; BMI: <strong>{record.bmi ?? '...'}</strong></p>
      <p className="text-[12pt]">Mạch: <strong>{record.pulse ?? '...'}</strong>; HA: <strong>{record.bloodPressureSys ?? '...'}/{record.bloodPressureDia ?? '...'}</strong> mmHg</p>
      <p className="text-[12pt]">Phân loại thể lực: <em>{record.physicalClassification ?? ''}</em></p>
    </div>
  );

  // PAGE 4 - Section III Khám lâm sàng (Nội khoa)
  pages.push(
    <div>
      <h3 className="font-bold text-[13pt]">III. KHÁM LÂM SÀNG</h3>
      <table className="w-full border border-black mt-1" style={{ borderCollapse: 'collapse', fontSize: '9pt' }}>
        <thead>
          <tr>
            <th className="border border-black p-1 text-left" style={{ width: '60%' }}>Nội dung</th>
            <th className="border border-black p-1 text-left">Chữ ký BS</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan={2} className="border border-black p-1 font-bold bg-slate-50">1. Nội khoa</td></tr>
          {noiList.map((sp, idx) => {
            const ex = exMap[sp];
            const letter = ['a','b','c','d','đ','e','g','h'][idx];
            return (
              <tr key={sp}>
                <td className="border border-black p-1">
                  <span className="italic">{letter}) {noiLabels[sp]}:</span> <span className="text-[11pt]">{ex?.findings ?? ''}</span>
                  {ex?.classification && <span className="text-[10pt] text-slate-500"> [PL: {ex.classification}]</span>}
                </td>
                <td className="border border-black p-1 align-middle"><CellSig ex={ex} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // PAGE 5 - Khám lâm sàng (Ngoại + Mắt + TMH + RHM + Sản nếu nữ)
  pages.push(
    <div>
      <h3 className="font-bold text-[13pt]">III. KHÁM LÂM SÀNG (tiếp)</h3>
      <table className="w-full border border-black mt-1" style={{ borderCollapse: 'collapse', fontSize: '9pt' }}>
        <tbody>
          <tr>
            <td className="border border-black p-1" style={{ width: '60%' }}>
              <strong>2. Ngoại khoa, Da liễu:</strong>
              <div>- Ngoại: {exMap['NGOAI_KHOA']?.findings ?? ''}</div>
              <div>- Da liễu: {exMap['DA_LIEU']?.findings ?? ''}</div>
            </td>
            <td className="border border-black p-1 align-middle"><CellSig ex={exMap['NGOAI_KHOA'] || exMap['DA_LIEU']} /></td>
          </tr>
          {isFemale && (
            <tr>
              <td className="border border-black p-1">
                <strong>3. Sản phụ khoa:</strong>
                <div className="whitespace-pre-wrap">{exMap['SAN_PHU_KHOA']?.findings ?? ''}</div>
              </td>
              <td className="border border-black p-1 align-middle"><CellSig ex={exMap['SAN_PHU_KHOA']} /></td>
            </tr>
          )}
          <tr>
            <td className="border border-black p-1">
              <strong>4. Mắt:</strong>
              <div>Không kính: P {matX.khongKinhPhai ?? '...'} – T {matX.khongKinhTrai ?? '...'}</div>
              <div>Có kính: P {matX.coKinhPhai ?? '...'} – T {matX.coKinhTrai ?? '...'}</div>
              <div className="text-[11pt]">{exMap['MAT']?.findings ?? ''}</div>
            </td>
            <td className="border border-black p-1 align-middle"><CellSig ex={exMap['MAT']} /></td>
          </tr>
          <tr>
            <td className="border border-black p-1">
              <strong>5. Tai-Mũi-Họng:</strong>
              <div>Tai T: NT {tmhX.tranTraiNoiThuong ?? '...'}m, NTh {tmhX.tranTraiNoiTham ?? '...'}m</div>
              <div>Tai P: NT {tmhX.tranPhaiNoiThuong ?? '...'}m, NTh {tmhX.tranPhaiNoiTham ?? '...'}m</div>
              <div className="text-[11pt]">{exMap['TAI_MUI_HONG']?.findings ?? ''}</div>
            </td>
            <td className="border border-black p-1 align-middle"><CellSig ex={exMap['TAI_MUI_HONG']} /></td>
          </tr>
          <tr>
            <td className="border border-black p-1">
              <strong>6. Răng-Hàm-Mặt:</strong>
              <div>Hàm trên: {rhmX.hamTren ?? '...'}; Hàm dưới: {rhmX.hamDuoi ?? '...'}</div>
              <div className="text-[11pt]">{exMap['RANG_HAM_MAT']?.findings ?? ''}</div>
            </td>
            <td className="border border-black p-1 align-middle"><CellSig ex={exMap['RANG_HAM_MAT']} /></td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  // PAGE 6+ - Cận lâm sàng (chunks 2 mục/page)
  const allCls = record.paraclinicals;
  const chunkSize = 2;
  if (allCls.length === 0) {
    pages.push(
      <div>
        <h3 className="font-bold text-[13pt]">IV. KHÁM CẬN LÂM SÀNG</h3>
        <p className="italic text-[12pt] text-slate-500 mt-2">Chưa có kết quả CLS.</p>
      </div>
    );
  } else {
    for (let i = 0; i < allCls.length; i += chunkSize) {
      const chunk = allCls.slice(i, i + chunkSize);
      pages.push(
        <div>
          <h3 className="font-bold text-[13pt]">IV. KHÁM CẬN LÂM SÀNG{allCls.length > chunkSize && ` (${i+1}-${Math.min(i+chunkSize, allCls.length)}/${allCls.length})`}</h3>
          <div className="space-y-2 mt-2">
            {chunk.map((p) => (
              <div key={p.id} className="border border-black p-1.5 text-[11.5pt]">
                <div className="font-bold">▸ {p.category}{p.testName !== p.category && ` — ${p.testName}`}</div>
                {p.result && <pre className="whitespace-pre-wrap font-serif text-[11pt] mt-1 leading-tight">{p.result}</pre>}
                {p.evaluation && <div className="text-[11pt] mt-0.5"><b>Đánh giá:</b> <em>{p.evaluation}</em></div>}
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  // FINAL PAGE - Conclusion
  pages.push(
    <div>
      <h3 className="font-bold text-[13pt]">V. KẾT LUẬN</h3>
      <p className="text-[12pt] mt-2"><strong>1. Phân loại:</strong> {record.finalClassification ? CLASSIFICATION_LABELS[record.finalClassification] : '...'}</p>
      <p className="text-[12pt] mt-1"><strong>2. Bệnh, tật:</strong></p>
      <div className="border-b border-dashed min-h-[3em] whitespace-pre-wrap mt-1 px-1 text-[12pt]">
        {record.conclusionText ?? ''}
      </div>

      <div className="flex justify-end mt-8">
        <div className="text-center relative" style={{ minWidth: 200 }}>
          {record.concluderSignedAt && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src="/assets/images/stamp.png"
              alt="Con dấu"
              style={{
                position: 'absolute',
                width: 110, height: 110,
                left: '5%', top: '35%',
                opacity: 0.92,
                pointerEvents: 'none',
                zIndex: 2,
                mixBlendMode: 'multiply',
              }}
            />
          )}
          <div className="italic text-[11pt]">
            {record.concluderSignedAt ? formatDate(record.concluderSignedAt) : '......, ngày..... tháng..... năm.....'}
          </div>
          <div className="font-bold mt-1 text-[12pt]">NGƯỜI KẾT LUẬN</div>
          <div className="italic text-[10pt]">(Ký, ghi rõ họ tên và đóng dấu)</div>
          <div style={{ minHeight: 60, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            {(() => {
              const { image, caHash } = parseSig(record.concluderSignatureDataUrl);
              return (
                <>
                  {image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={image} alt="" style={{ maxHeight: 55 }} />
                  )}
                  {caHash && (
                    <div className="border-2 border-green-600 bg-green-50 rounded px-2 py-1 text-center">
                      <div className="font-bold text-green-800 text-[11pt]">✓ ĐÃ KÝ SỐ VNPT SmartCA</div>
                      <div className="font-mono text-[7pt] text-green-700">Hash: {caHash.slice(0, 22)}...</div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          <div className="font-bold text-[12pt]">{record.concluderNameSnapshot ?? record.concluder?.fullName ?? ''}</div>
          {(record.concluderTitleSnapshot ?? record.concluder?.jobTitle) && (
            <div className="text-[11pt] italic">{record.concluderTitleSnapshot ?? record.concluder?.jobTitle}</div>
          )}
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center text-[10pt] text-slate-400 italic">
        Software Copyright Powered by Dat Dat
      </div>
    </div>
  );

  return (
    <BookViewer
      pages={pages}
      title={`Sổ KSK • ${record.employee.fullName}`}
      subtitle={`${record.examRound.name} • ${record.employee.department.name}`}
    />
  );
}
