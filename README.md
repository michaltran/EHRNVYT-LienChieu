# Hệ thống Quản lý Hồ sơ Sức khỏe Định kỳ — TTYT khu vực Liên Chiểu

Next.js 14 fullstack app quản lý quy trình khám sức khỏe định kỳ cho viên chức/người lao động, áp dụng **Mẫu số 03** theo Thông tư 32/2023/TT-BYT, tích hợp ký số VNPT SmartCA.

---

## 🔐 TÀI KHOẢN ĐẦY ĐỦ CÁC PHÂN HỆ

| # | Phân hệ (Role) | Email | Password | Vai trò |
|---|---|---|---|---|
| 1 | ADMIN | `admin@lienchieu.vn` | `admin123` | Quản trị toàn hệ thống — import NV, tạo đợt khám, duyệt hồ sơ, in báo cáo |
| 2 | CONCLUDER | `giamdoc@lienchieu.vn` | `conclude123` | Bác sĩ kết luận (Giám đốc) — phân loại sức khỏe, ký số kết luận cuối |
| 3 | DOCTOR (Nội khoa) | `bs.noikhoa@lienchieu.vn` | `doctor123` | Khám 8 chuyên khoa Nội: Tuần hoàn, Hô hấp, Tiêu hóa, Thận-Tiết niệu, Nội tiết, Cơ-Xương-Khớp, Thần kinh, Tâm thần |
| 4 | DOCTOR (Ngoại) | `bs.ngoai@lienchieu.vn` | `doctor123` | Khám Ngoại khoa + Da liễu |
| 5 | DOCTOR (Sản phụ) | `bs.sanphu@lienchieu.vn` | `doctor123` | Khám Sản phụ khoa (chỉ NV nữ) |
| 6 | DOCTOR (Mắt) | `bs.mat@lienchieu.vn` | `doctor123` | Khám Mắt + thị lực |
| 7 | DOCTOR (TMH) | `bs.tmh@lienchieu.vn` | `doctor123` | Khám Tai - Mũi - Họng + thính lực |
| 8 | DOCTOR (RHM) | `bs.rhm@lienchieu.vn` | `doctor123` | Khám Răng - Hàm - Mặt |
| 9 | KTV_XETNGHIEM | `ktv.xn@lienchieu.vn` | `ktv123` | Nhập kết quả Xét nghiệm: Công thức máu, Sinh hoá, Miễn dịch |
| 10 | KTV_CHANDOANHINHANH | `ktv.cdha@lienchieu.vn` | `ktv123` | Nhập kết quả CĐHA: Điện tim, Điện não, X-quang, Siêu âm, CT |
| 11 | VITAL_STAFF | `dieuduong@lienchieu.vn` | `vital123` | Đo thể lực: chiều cao, cân nặng, BMI, mạch, huyết áp |
| 12 | DEPT_REP | `dept@lienchieu.vn` | `dept123` | Đại diện khoa — tổng hợp hồ sơ rồi gửi lên Admin |
| 13 | EMPLOYEE | `nhanvien@lienchieu.vn` | `nhanvien123` | Nhân viên — xem hồ sơ cá nhân |

> **⚠️ ĐỔI MẬT KHẨU NGAY** sau khi golive: Admin Portal → Tài khoản → Đổi MK.

---

## 📋 Cận lâm sàng — biểu mẫu chuẩn

Khi nhập kết quả CLS, hệ thống tự nạp template chuẩn theo loại:

| Loại CLS | Người nhập | Trường biểu mẫu |
|---|---|---|
| **Công thức máu** | KTV_XETNGHIEM | WBC, RBC, HGB, HCT, PLT, MCV, MCH, MCHC + giá trị bình thường |
| **Sinh hoá** | KTV_XETNGHIEM | Glucose, Ure, Creatinin, AST, ALT, Cholesterol, Triglycerid, HDL, LDL, Acid uric |
| **Miễn dịch** | KTV_XETNGHIEM | HBsAg, Anti-HCV, HIV, TSH, FT4 |
| **Điện tim** | KTV_CDHA | Tần số, nhịp, trục, sóng P, PR, QRS, ST-T, kết luận |
| **Điện não** | KTV_CDHA | Nhịp nền, phản ứng mở mắt, thử nghiệm thở sâu, kích thích ánh sáng, kết luận |
| **X-quang** | KTV_CDHA | Vùng chụp, kỹ thuật, mô tả (bóng tim/trung thất/phổi/khung xương/cơ hoành), kết luận |
| **Siêu âm** | KTV_CDHA | Vùng SA, kỹ thuật, mô tả (gan/mật/tụy/lách/thận/bàng quang/sinh dục), kết luận |
| **CT** | KTV_CDHA | Vùng chụp, kỹ thuật, cửa sổ, mô tả tổn thương, kết luận |

User chỉnh sửa các giá trị `........` trong template. Có thể đính kèm PDF/ảnh kết quả scan (≤10MB).

---

## 🖨️ In Mẫu số 03 (Sổ KSK định kỳ)

- **Khổ giấy**: A4 (210×297mm), font Times New Roman
- **In hai mặt — kiểu quyển sách**: Mép gáy có lề trong rộng hơn (22mm vs 15mm) để khi đóng gáy không che chữ
- **Ô chữ ký không có viền** khi in giấy (chỉ hiện viền trên màn hình để dễ thấy ô)
- Hỗ trợ ngắt trang tự nhiên giữa các phần (`page-break-before` cho phần CLS, `avoid-break` để giữ ô chữ ký + 1 mục CLS không bị xé đôi)

Cách in:
1. Mở 1 hồ sơ → bấm **In** trên trang chi tiết (`/records/[id]/print`)
2. Trong dialog in của trình duyệt: chọn **In hai mặt → Lật cạnh dài** (Long edge)
3. Margins: chọn **Mặc định** (CSS `@page` đã set sẵn)

---

## 🏗️ Triển khai Production (Local Server + Cloudflare Tunnel)

Đã deploy thành công trên máy server với:

- **PostgreSQL 18** local: database `ehr_lienchieu`
- **Windows Service `EHR-LienChieu`** (qua NSSM): chạy Next.js port 3000, tự khởi động cùng Windows
- **Windows Service `Cloudflared-EHR`**: tunnel `ehr-lienchieu` → `https://ehrlienchieu.io.vn`
- Logs: `logs/app.log`, `logs/cloudflared.log` (rotate 10MB)
- File CLS lưu local tại `./storage/`, phục vụ qua `/api/files/[...path]` (yêu cầu auth)

### Lệnh quản trị (Admin PowerShell)

```powershell
# Restart app khi sửa code
Restart-Service EHR-LienChieu

# Xem log realtime
Get-Content '...\logs\app-error.log' -Tail 50 -Wait

# Restart tunnel
Restart-Service Cloudflared-EHR

# Status
Get-Service EHR-LienChieu, Cloudflared-EHR
```

### Cấu hình `.env`

```dotenv
DATABASE_URL="postgresql://postgres:***@localhost:5432/ehr_lienchieu?schema=public"
AUTH_SECRET="<64-char-random>"

# VNPT SmartCA Production
VNPT_SCA_URL="https://gwsca.vnpt.vn/sca/sp769"
VNPT_SCA_SP_ID="<Client ID>"
VNPT_SCA_SP_PASSWORD="<Client Secret>"
VNPT_SCA_MOBILE_CODE="<MobileCode partner>"

LOCAL_STORAGE_DIR="./storage"
NODE_ENV="production"
PORT="3000"
```

### Cấu hình SmartCA cho từng bác sĩ

Bác sĩ login → vào `/setup` (hoặc profile) → nhập:
- **CCCD**
- **Mật khẩu SmartCA** (do user tự đặt khi đăng ký với VNPT)
- **TOTP Secret**: chuỗi base64/base32/hex từ VNPT — hệ thống tự decode

Sau khi save, mỗi lần ký hệ thống tự sinh OTP từ TOTP secret → ký luôn không cần mở app điện thoại.

---

## 🛠️ Công nghệ

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Prisma ORM + PostgreSQL 18 (local) hoặc Neon Cloud
- JWT auth (`jose` + `bcryptjs`), cookie httpOnly
- `react-signature-canvas` cho canvas chữ ký offline
- `xlsx` (SheetJS) cho import/export Excel
- `recharts` cho biểu đồ thống kê
- VNPT SmartCA API v4.0 — tích hợp SmartCA TH (TOTP, không cần app xác nhận)

---

## 📌 Kịch bản end-to-end

1. **Admin**: Import Excel NV → Tạo đợt khám → Generate hồ sơ → Mở đợt → Gửi thông báo
2. **Điều dưỡng (VITAL_STAFF)**: Đo thể lực → ký
3. **Bác sĩ (DOCTOR)**: Khám theo chuyên khoa → ký SmartCA hoặc canvas
4. **KTV (XN/CDHA)**: Nhập kết quả CLS → upload file scan
5. **Đại diện khoa (DEPT_REP)**: Tổng hợp → gửi lên Admin
6. **Admin**: Duyệt → chuyển BS kết luận
7. **BS kết luận (CONCLUDER)**: Phân loại + kết luận → Ký VNPT SmartCA → Hoàn tất
8. **Admin**: In Mẫu 03 (in 2 mặt, lật quyển) → Xuất Excel báo cáo

---

## 📁 Cấu trúc thư mục

```
EHR-LienChieu/
├── prisma/
│   ├── schema.prisma           # 10 models + 8 enums
│   └── seed.ts                 # Seed 13 tài khoản + 427 NV từ Excel
├── data/nhan-su.xlsx           # Danh sách nhân sự thực tế
├── storage/                    # File CLS local (gitignored)
├── logs/                       # NSSM logs (gitignored)
├── scripts/
│   ├── install-service.ps1     # Cài Windows Service Next.js
│   ├── install-cf-service.ps1  # Cài Windows Service tunnel
│   └── setup-cloudflared.ps1   # Tạo tunnel mới end-to-end
├── src/
│   ├── app/
│   │   ├── admin/              # Portal Admin
│   │   ├── doctor/             # Portal Bác sĩ
│   │   ├── conclude/           # Portal Kết luận
│   │   ├── dept/               # Portal Đại diện khoa
│   │   ├── paraclinical/       # Portal KTV (XN + CDHA)
│   │   ├── vital/              # Portal Điều dưỡng đo thể lực
│   │   ├── me/                 # Portal Nhân viên
│   │   ├── records/[id]/print/ # In Mẫu 03 — A4 book layout
│   │   ├── records/blank/      # Sổ trắng (in hàng loạt)
│   │   └── api/
│   │       ├── files/[...path] # Phục vụ file local
│   │       ├── smartca/        # SmartCA TH endpoints (v2)
│   │       ├── admin/, doctor/, paraclinical/, conclude/, vital/
│   │       └── setup/          # 1-click khởi tạo
│   ├── components/
│   │   ├── ParaclinicalPanel.tsx  # Form CLS với template chuẩn
│   │   ├── SignaturePad.tsx       # Canvas + upload PNG
│   │   ├── SmartCASignButton.tsx  # Ký số VNPT
│   │   └── ...
│   └── lib/
│       ├── paraclinical-templates.ts  # Template chuẩn cho 8 loại CLS
│       ├── local-storage.ts           # File storage local
│       ├── vnpt-smartca.ts            # VNPT client v1+v2
│       ├── crypto-utils.ts            # AES-256-GCM + TOTP RFC 6238
│       └── ...
└── README.md
```

---

## ⚠️ Ghi chú chữ ký số

- **Chữ ký canvas/PNG**: không có giá trị pháp lý, dùng nội bộ
- **Chữ ký VNPT SmartCA**: có giá trị pháp lý theo Luật Giao dịch điện tử
- Hệ thống phân biệt 2 loại bằng prefix `CA:...` trong DB
- Hash SHA256 của nội dung khám được gửi VNPT (hash-based), không gửi PDF
- SmartCA TH (gói tích hợp): không cần mở app, chỉ cần `password + OTP` (TOTP tự sinh)
- Log ký số lưu trong `CaSignTransaction` để audit
- Tài liệu tham khảo: VNPT SmartCA API v4.0 (file `Kich_ban_tich_hop_smartca_v4.1.pdf`)

---

## 📞 Liên hệ kỹ thuật

Software Copyright Powered by **Dat Dat**. Dùng nội bộ TTYT khu vực Liên Chiểu.
