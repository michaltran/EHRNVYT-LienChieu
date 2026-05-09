// Template kết quả mặc định cho từng loại CLS - tự động điền khi đổi category
// Người dùng có thể điền vào các dấu "..." để có biểu mẫu chuẩn

export const PARACLINICAL_CATEGORIES = [
  'Công thức máu',
  'Sinh hoá',
  'Miễn dịch',
  'Điện tim',
  'Điện não',
  'X-quang',
  'Siêu âm',
  'CT',
  'Khác',
] as const;

export type ParaclinicalCategory = (typeof PARACLINICAL_CATEGORIES)[number];

// Loại CLS thuộc nhóm KTV Xét nghiệm
export const XN_CATEGORIES: ParaclinicalCategory[] = ['Công thức máu', 'Sinh hoá', 'Miễn dịch'];

// Loại CLS thuộc nhóm KTV Chẩn đoán hình ảnh
export const CDHA_CATEGORIES: ParaclinicalCategory[] = ['Điện tim', 'Điện não', 'X-quang', 'Siêu âm', 'CT'];

export const RESULT_TEMPLATES: Record<string, string> = {
  'Công thức máu': `WBC (Bạch cầu): ........ K/μL  (BT: 4-10)
RBC (Hồng cầu): ........ M/μL  (BT: 4.0-5.5)
HGB (Hemoglobin): ........ g/dL  (BT: 12-17)
HCT (Hematocrit): ........ %  (BT: 36-50)
PLT (Tiểu cầu): ........ K/μL  (BT: 150-450)
MCV: ........ fL  |  MCH: ........ pg  |  MCHC: ........ g/dL`,

  'Sinh hoá': `Glucose: ........ mmol/L  (BT: 3.9-6.4)
Ure: ........ mmol/L  (BT: 2.5-7.5)
Creatinin: ........ μmol/L  (BT: 53-115)
AST (SGOT): ........ U/L  (BT: <40)
ALT (SGPT): ........ U/L  (BT: <40)
Cholesterol TP: ........ mmol/L  (BT: <5.2)
Triglycerid: ........ mmol/L  (BT: <1.7)
HDL-C: ........ mmol/L  |  LDL-C: ........ mmol/L
Acid Uric: ........ μmol/L  (Nam 200-420, Nữ 140-360)`,

  'Miễn dịch': `HBsAg: ........ (Âm tính / Dương tính)
Anti-HCV: ........ (Âm tính / Dương tính)
HIV: ........ (Âm tính / Dương tính)
TSH: ........ μIU/mL  (BT: 0.27-4.20)
FT4: ........ pmol/L  (BT: 12-22)`,

  'Điện tim': `Tần số: ........ ck/phút   Nhịp: ........ (Xoang/Nhanh/Chậm/Loạn nhịp)
Trục điện tim: ........
Sóng P: ........  PR: ........ s
QRS: ........ s
ST-T: ........
Kết luận: ........`,

  'Điện não': `Nhịp nền: ........ Hz  (Alpha/Beta/Theta/Delta)
Phản ứng mở mắt: ........
Thử nghiệm thở sâu: ........
Kích thích ánh sáng: ........
Sóng bệnh lý: ........ (không có / có - mô tả)
Kết luận: ........`,

  'X-quang': `Vùng chụp: ........
Kỹ thuật: ........
Mô tả hình ảnh:
- Bóng tim: ........
- Trung thất: ........
- Phổi 2 bên: ........
- Khung xương: ........
- Cơ hoành, góc sườn hoành: ........
Kết luận: ........`,

  'Siêu âm': `Vùng siêu âm: ........  (Ổ bụng tổng quát / Tuyến giáp / Tim / ...)
Kỹ thuật: 2D, Doppler màu
Mô tả:
- Gan: ........
- Túi mật: ........
- Tụy: ........
- Lách: ........
- Thận 2 bên: ........
- Bàng quang: ........
- Tử cung-phần phụ / Tiền liệt tuyến: ........
Kết luận: ........`,

  'CT': `Vùng chụp: ........
Kỹ thuật: ........ (Có/Không tiêm thuốc cản quang)
Cửa sổ: ........
Mô tả tổn thương:
........
Kết luận: ........`,

  'Khác': '',
};

export function getTemplateFor(category: string): string {
  return RESULT_TEMPLATES[category] ?? '';
}
