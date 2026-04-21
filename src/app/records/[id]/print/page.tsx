import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { SPECIALTY_LABELS, CLASSIFICATION_LABELS, formatDate } from '@/lib/constants';
import PrintButton from './print-button';

// Trang này trình bày đúng Mẫu số 03 để in ra giấy hoặc "In → Lưu dưới dạng PDF" trong trình duyệt.
// Mọi role đã đăng nhập đều có thể xem (check quyền ở middleware + ở đây).

export default async function PrintRecord({ params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) redirect('/login');

  const record = await prisma.healthRecord.findUnique({
    where: { id: params.id },
    include: {
      employee: { include: { department: true } },
      examRound: true,
      clinicalExams: { include: { doctor: { select: { fullName: true } } } },
      paraclinicals: true,
      concluder: { select: { fullName: true } },
    },
  });
  if (!record) notFound();

  // Gom nội khoa riêng
  const noi = ['NOI_TUAN_HOAN','NOI_HO_HAP','NOI_TIEU_HOA','NOI_THAN_TIET_NIEU','NOI_TIET','CO_XUONG_KHOP','THAN_KINH','TAM_THAN'];
  const exMap = Object.fromEntries(record.clinicalExams.map((e) => [e.specialty, e]));
  const dob = record.employee.dateOfBirth;
  const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : '';

  return (
    <div className="bg-white">
      <div className="no-print bg-slate-100 p-3 flex justify-between items-center sticky top-0 z-10 border-b">
        <a href="javascript:history.back()" className="text-sm text-slate-600 hover:underline">← Quay lại</a>
        <PrintButton />
      </div>

      <div className="print-page mx-auto" style={{ maxWidth: '210mm', padding: '15mm', fontFamily: 'Times New Roman, serif', fontSize: '13pt', lineHeight: 1.5 }}>
        <div className="text-center">
          <div className="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div className="font-bold">Độc lập - Tự do - Hạnh phúc</div>
          <div>---------------</div>
        </div>
        <div className="text-right italic text-sm mt-2">Mẫu số 03</div>
        <h1 className="text-center font-bold text-xl mt-4 mb-6">SỔ KHÁM SỨC KHỎE ĐỊNH KỲ</h1>

        {/* Phần hành chính */}
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
                <p>1. Họ và tên <em>(in hoa)</em>: <strong>{record.employee.fullName.toUpperCase()}</strong></p>
                <p>2. Giới tính: Nam {record.employee.gender === 'MALE' ? '☑' : '☐'} &nbsp;&nbsp; Nữ {record.employee.gender === 'FEMALE' ? '☑' : '☐'}</p>
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
          <p><strong>7. Nghề nghiệp:</strong> {record.employee.occupation ?? '.........................................................................................'}</p>
          <p><strong>8. Nơi công tác, học tập:</strong> {record.employee.workplace ?? '...........................................................'}</p>
          <p><strong>9. Ngày bắt đầu vào làm việc tại đơn vị hiện nay:</strong> {record.employee.startWorkingDate ? formatDate(record.employee.startWorkingDate) : '............/........../..................'}</p>
          <p><strong>11. Tiền sử bệnh, tật của gia đình:</strong></p>
          <p className="border-b border-dashed border-slate-400 min-h-[1.5em]">{record.employee.familyHistory ?? ''}</p>
          <p className="border-b border-dashed border-slate-400 min-h-[1.5em]"></p>
        </div>

        <div className="mt-6 page-break-before" style={{ pageBreakBefore: 'always' }}>
          <h2 className="text-center font-bold text-lg mb-4">KHÁM SỨC KHỎE ĐỊNH KỲ</h2>

          <h3 className="font-bold">I. TIỀN SỬ BỆNH, TẬT</h3>
          <p className="italic text-sm">(Bác sỹ khám sức khỏe hỏi và ghi chép)</p>
          <div className="border-b border-dashed border-slate-400 mt-2 min-h-[4em] whitespace-pre-wrap">
            {record.medicalHistoryNote ?? ''}
          </div>

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
              {/* 1. Nội khoa */}
              <tr><td colSpan={2} className="border border-black p-1 font-bold bg-slate-50">1. Nội khoa</td></tr>
              {noi.map((sp) => {
                const ex = exMap[sp as keyof typeof exMap];
                const label = SPECIALTY_LABELS[sp as keyof typeof SPECIALTY_LABELS];
                return (
                  <tr key={sp}>
                    <td className="border border-black p-2">
                      <em>{label.replace('Nội - ','').replace('Nội tiết','Nội tiết')}</em>
                      <div className="min-h-[1.5em] whitespace-pre-wrap">{ex?.findings ?? ''}</div>
                      <div className="text-xs">Phân loại: {ex?.classification ?? ''}</div>
                    </td>
                    <td className="border border-black p-2 text-center align-bottom">
                      {ex?.signatureDataUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={ex.signatureDataUrl} alt="" style={{ maxHeight: 50, margin: '0 auto' }} />
                      )}
                      <div className="text-xs">{ex?.doctor?.fullName ?? ''}</div>
                    </td>
                  </tr>
                );
              })}

              {/* 2. Ngoại khoa, Da liễu */}
              <tr>
                <td className="border border-black p-2">
                  <strong>2. Ngoại khoa, Da liễu:</strong>
                  <div>- Ngoại khoa: {exMap['NGOAI_KHOA']?.findings ?? ''}</div>
                  <div className="text-xs">Phân loại: {exMap['NGOAI_KHOA']?.classification ?? ''}</div>
                  <div>- Da liễu: {exMap['DA_LIEU']?.findings ?? ''}</div>
                  <div className="text-xs">Phân loại: {exMap['DA_LIEU']?.classification ?? ''}</div>
                </td>
                <td className="border border-black p-2 text-center align-bottom">
                  {exMap['NGOAI_KHOA']?.signatureDataUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={exMap['NGOAI_KHOA']!.signatureDataUrl!} alt="" style={{ maxHeight: 50, margin: '0 auto' }} />
                  )}
                  <div className="text-xs">{exMap['NGOAI_KHOA']?.doctor?.fullName ?? ''}</div>
                </td>
              </tr>

              {/* 3. Sản phụ khoa */}
              {record.employee.gender === 'FEMALE' && (
                <tr>
                  <td className="border border-black p-2">
                    <strong>3. Sản phụ khoa:</strong>
                    <div className="whitespace-pre-wrap">{exMap['SAN_PHU_KHOA']?.findings ?? ''}</div>
                    <div className="text-xs">Phân loại: {exMap['SAN_PHU_KHOA']?.classification ?? ''}</div>
                  </td>
                  <td className="border border-black p-2 text-center align-bottom">
                    {exMap['SAN_PHU_KHOA']?.signatureDataUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={exMap['SAN_PHU_KHOA']!.signatureDataUrl!} alt="" style={{ maxHeight: 50, margin: '0 auto' }} />
                    )}
                    <div className="text-xs">{exMap['SAN_PHU_KHOA']?.doctor?.fullName ?? ''}</div>
                  </td>
                </tr>
              )}

              {/* 4. Mắt */}
              <tr>
                <td className="border border-black p-2">
                  <strong>4. Mắt:</strong>
                  <div className="whitespace-pre-wrap">{exMap['MAT']?.findings ?? ''}</div>
                  <div className="text-xs">Phân loại: {exMap['MAT']?.classification ?? ''}</div>
                </td>
                <td className="border border-black p-2 text-center align-bottom">
                  {exMap['MAT']?.signatureDataUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={exMap['MAT']!.signatureDataUrl!} alt="" style={{ maxHeight: 50, margin: '0 auto' }} />
                  )}
                  <div className="text-xs">{exMap['MAT']?.doctor?.fullName ?? ''}</div>
                </td>
              </tr>

              {/* 5. TMH */}
              <tr>
                <td className="border border-black p-2">
                  <strong>5. Tai - Mũi - Họng:</strong>
                  <div className="whitespace-pre-wrap">{exMap['TAI_MUI_HONG']?.findings ?? ''}</div>
                  <div className="text-xs">Phân loại: {exMap['TAI_MUI_HONG']?.classification ?? ''}</div>
                </td>
                <td className="border border-black p-2 text-center align-bottom">
                  {exMap['TAI_MUI_HONG']?.signatureDataUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={exMap['TAI_MUI_HONG']!.signatureDataUrl!} alt="" style={{ maxHeight: 50, margin: '0 auto' }} />
                  )}
                  <div className="text-xs">{exMap['TAI_MUI_HONG']?.doctor?.fullName ?? ''}</div>
                </td>
              </tr>

              {/* 6. RHM */}
              <tr>
                <td className="border border-black p-2">
                  <strong>6. Răng - Hàm - Mặt:</strong>
                  <div className="whitespace-pre-wrap">{exMap['RANG_HAM_MAT']?.findings ?? ''}</div>
                  <div className="text-xs">Phân loại: {exMap['RANG_HAM_MAT']?.classification ?? ''}</div>
                </td>
                <td className="border border-black p-2 text-center align-bottom">
                  {exMap['RANG_HAM_MAT']?.signatureDataUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={exMap['RANG_HAM_MAT']!.signatureDataUrl!} alt="" style={{ maxHeight: 50, margin: '0 auto' }} />
                  )}
                  <div className="text-xs">{exMap['RANG_HAM_MAT']?.doctor?.fullName ?? ''}</div>
                </td>
              </tr>
            </tbody>
          </table>

          <h3 className="font-bold mt-4">IV. KHÁM CẬN LÂM SÀNG</h3>
          <div className="border border-black p-2 text-sm min-h-[6em]">
            {record.paraclinicals.length > 0 ? (
              <ul className="list-disc pl-5">
                {record.paraclinicals.map((p) => (
                  <li key={p.id}><strong>{p.category} - {p.testName}:</strong> {p.result} {p.evaluation && <em>({p.evaluation})</em>}</li>
                ))}
              </ul>
            ) : <p className="italic text-slate-500">Chưa có kết quả cận lâm sàng</p>}
          </div>

          <h3 className="font-bold mt-4">V. KẾT LUẬN</h3>
          <p><strong>1. Phân loại sức khỏe:</strong> {record.finalClassification ? CLASSIFICATION_LABELS[record.finalClassification] : '...................................................'}</p>
          <p><strong>2. Các bệnh, tật (nếu có):</strong></p>
          <div className="border-b border-dashed border-slate-400 min-h-[4em] whitespace-pre-wrap mt-1">
            {record.conclusionText ?? ''}
          </div>

          <div className="flex justify-end mt-10">
            <div className="text-center">
              <div className="italic text-sm">
                {record.concluderSignedAt ? formatDate(record.concluderSignedAt) : '......, ngày ..... tháng ..... năm ........'}
              </div>
              <div className="font-bold mt-1">NGƯỜI KẾT LUẬN</div>
              <div className="italic text-sm">(Ký, ghi rõ họ tên và đóng dấu)</div>
              <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {record.concluderSignatureDataUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={record.concluderSignatureDataUrl} alt="" style={{ maxHeight: 60 }} />
                )}
              </div>
              <div className="font-bold">{record.concluder?.fullName ?? ''}</div>
            </div>
          </div>

          <hr className="mt-6 border-slate-300" />
          <p className="text-xs text-slate-500 italic mt-1">
            <sup>1</sup> Phân loại sức khỏe theo quy định của Bộ Y tế.{' '}
            <sup>2</sup> Ghi rõ các bệnh, tật, phương án điều trị, phục hồi chức năng hoặc giới thiệu khám chuyên khoa (nếu có).
          </p>
        </div>
      </div>
    </div>
  );
}
