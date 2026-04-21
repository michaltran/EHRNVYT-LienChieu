# Hệ thống Quản lý Hồ sơ Sức khỏe Định kỳ — TTYT khu vực Liên Chiểu

Ứng dụng fullstack Next.js 14 để quản lý quy trình khám sức khỏe định kỳ cho viên chức và người lao động tại Trung tâm Y tế khu vực Liên Chiểu, áp dụng **Mẫu số 03** theo Thông tư 32.

## Tính năng

### 5 vai trò người dùng

| Vai trò | Chức năng chính |
|---|---|
| **ADMIN** | Import Excel nhân sự, tạo đợt khám, duyệt hồ sơ, xuất báo cáo thống kê |
| **DOCTOR** (Bác sĩ khám) | Khám theo chuyên khoa được phân công, ký điện tử từng mục |
| **CONCLUDER** (BS kết luận / Giám đốc) | Xem toàn bộ kết quả, ký kết luận cuối |
| **DEPT_REP** (Đại diện khoa) | Theo dõi, tổng hợp và gửi hồ sơ lên Admin |
| **EMPLOYEE** | Xem hồ sơ sức khỏe cá nhân |

### 14 chuyên khoa khám (theo Mẫu số 03)

Nội - Tuần hoàn, Nội - Hô hấp, Nội - Tiêu hóa, Nội - Thận-Tiết niệu, Nội tiết, Cơ-xương-khớp, Thần kinh, Tâm thần, Ngoại khoa, Da liễu, Sản phụ khoa, Mắt, Tai-Mũi-Họng, Răng-Hàm-Mặt.

### Quy trình 8 bước

1. **Admin** import danh sách nhân viên từ Excel + tạo đợt khám
2. Gửi thông báo đến đại diện các khoa
3. Nhân viên đi khám theo lịch
4. **Bác sĩ** các chuyên khoa khám + ký điện tử từng mục
5. **Đại diện khoa** tổng hợp và gửi hồ sơ lên Admin
6. **Admin** rà soát, duyệt hoặc trả lại
7. **BS kết luận** ký kết luận cuối cùng
8. Admin lưu trữ, xuất PDF theo Mẫu số 03

## Công nghệ

- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (dev) / PostgreSQL (prod) qua Prisma ORM
- **Auth**: JWT (jose) + bcrypt, cookie httpOnly
- **Chữ ký điện tử**: react-signature-canvas (lưu dưới dạng base64 PNG)
- **Import Excel**: SheetJS (xlsx) — xử lý trực tiếp trên browser
- **Biểu đồ**: Recharts
- **Deploy**: Tương thích Vercel

## Chạy local

### 1. Cài đặt

```bash
npm install
```

### 2. Thiết lập database

File `.env` đã có sẵn cấu hình SQLite cho dev:

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="dev-secret-change-me-in-production-please-min32"
```

Khởi tạo schema:

```bash
npx prisma db push
```

### 3. (Tuỳ chọn) Import danh sách nhân sự từ Excel

Copy file Excel của bạn vào thư mục `data/`:

```bash
mkdir -p data
cp /duong/dan/den/DANH_SACH_NHAN_SU.xlsx data/nhan-su.xlsx
```

Sau đó chạy seed:

```bash
npm run db:seed
```

Seed sẽ:
- Tạo các tài khoản demo (admin, bác sĩ, giám đốc)
- Nếu có `data/nhan-su.xlsx`: import toàn bộ nhân viên và khoa/phòng
- Tạo 1 đợt khám mẫu cho năm hiện tại

> **Không có file Excel cũng OK** — sau khi login admin, bạn có thể vào **Admin → Nhân viên → Import Excel** để upload qua UI.

### 4. Chạy dev server

```bash
npm run dev
```

Truy cập http://localhost:3000 và đăng nhập với tài khoản demo:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@lienchieu.vn` | `admin123` |
| BS kết luận | `giamdoc@lienchieu.vn` | `conclude123` |
| BS Nội khoa | `bs.noikhoa@lienchieu.vn` | `doctor123` |
| BS Ngoại khoa | `bs.ngoai@lienchieu.vn` | `doctor123` |
| BS Sản phụ khoa | `bs.sanphu@lienchieu.vn` | `doctor123` |
| BS Mắt | `bs.mat@lienchieu.vn` | `doctor123` |
| BS TMH | `bs.tmh@lienchieu.vn` | `doctor123` |
| BS RHM | `bs.rhm@lienchieu.vn` | `doctor123` |

> **Đổi mật khẩu ngay** trong môi trường thật: Admin → Tài khoản → Đổi MK.

## Kịch bản thử nghiệm end-to-end

1. Đăng nhập admin
2. **Admin → Nhân viên → Import Excel** (nếu chưa import qua seed)
3. **Admin → Đợt khám → Tạo đợt mới**
4. Vào chi tiết đợt vừa tạo:
   - Bấm "**1. Tạo hồ sơ cho tất cả nhân viên**"
   - Bấm "**2. Mở đợt khám**"
   - Bấm "**3. Gửi thông báo đến đại diện khoa**"
5. Đăng xuất, đăng nhập bằng tài khoản bác sĩ (vd `bs.noikhoa@lienchieu.vn`)
6. Vào **Hàng đợi khám** → chọn một nhân viên → **Vào khám**
   - Nhập thể lực → Lưu
   - Chọn từng chuyên khoa → nhập kết quả → **ký điện tử** → Lưu
7. Đăng nhập đại diện khoa (nếu đã tạo) → **Gửi lên Admin**
8. Đăng nhập admin → **Hồ sơ khám** → chọn hồ sơ → **Duyệt & chuyển BS kết luận**
9. Đăng nhập `giamdoc@lienchieu.vn` → chọn hồ sơ → nhập phân loại + ký → **Ký kết luận**
10. Quay lại admin → **In / Xuất PDF (Mẫu số 03)** để xem kết quả cuối

## Deploy lên GitHub + Vercel

### Bước 1: Push lên GitHub

```bash
git init
git add .
git commit -m "Initial commit: healthcheck app"
git branch -M main
git remote add origin https://github.com/<username>/healthcheck-lienchieu.git
git push -u origin main
```

### Bước 2: Tạo Postgres database

Chọn 1 trong 3 nhà cung cấp Postgres miễn phí/giá rẻ:

- **[Neon](https://neon.tech)** (khuyến nghị — free tier dùng được ngay)
- **[Supabase](https://supabase.com)**
- **[Vercel Postgres](https://vercel.com/storage/postgres)**

Sau khi tạo, copy connection string dạng:

```
postgresql://user:password@host:5432/dbname?sslmode=require
```

### Bước 3: Đổi Prisma provider sang Postgres

Mở `prisma/schema.prisma`, đổi:

```prisma
datasource db {
  provider = "postgresql"  // đổi từ sqlite
  url      = env("DATABASE_URL")
}
```

Commit và push.

### Bước 4: Import vào Vercel

1. Vào [vercel.com/new](https://vercel.com/new), import repo GitHub
2. Trong phần **Environment Variables**, thêm:
   - `DATABASE_URL` = chuỗi Postgres ở trên
   - `AUTH_SECRET` = chuỗi ngẫu nhiên dài (tạo bằng `openssl rand -base64 32`)
3. Bấm **Deploy**. Vercel sẽ tự chạy `prisma generate && prisma db push && next build` (đã cấu hình sẵn trong `package.json`).

### Bước 5: Seed tài khoản ban đầu trên production

Mở một terminal local với `DATABASE_URL` trỏ tới Postgres vừa tạo:

```bash
DATABASE_URL="postgresql://..." npm run db:seed
```

Xong. Truy cập domain Vercel và đăng nhập.

## Cấu trúc thư mục

```
healthcheck-app/
├── prisma/
│   ├── schema.prisma        # 9 models, 5 roles, 14 specialties
│   └── seed.ts              # Tạo tài khoản + import Excel
├── src/
│   ├── app/
│   │   ├── admin/           # Portal admin (dashboard, NV, khoa, users, rounds, records, reports)
│   │   ├── doctor/          # Portal bác sĩ khám
│   │   ├── conclude/        # Portal bác sĩ kết luận
│   │   ├── dept/            # Portal đại diện khoa
│   │   ├── me/              # Portal nhân viên tự xem
│   │   ├── records/[id]/print/  # In ra đúng Mẫu số 03
│   │   ├── api/             # REST API endpoints
│   │   ├── login/           # Trang đăng nhập
│   │   └── layout.tsx
│   ├── components/
│   │   ├── AppShell.tsx     # Sidebar + topbar chung
│   │   ├── EmployeeForm.tsx
│   │   └── SignaturePad.tsx # Component ký điện tử
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts          # JWT + bcrypt
│   │   └── constants.ts     # Vietnamese labels
│   └── middleware.ts        # Bảo vệ route
├── package.json
├── tailwind.config.js
├── .env.example
└── README.md
```

## Những việc còn có thể mở rộng

- [ ] Tích hợp SMTP thật để gửi email thông báo cho đại diện khoa (hiện đang mock + ghi audit log)
- [ ] Export PDF server-side (Puppeteer/pdf-lib) để không phụ thuộc vào hành vi "In → PDF" của trình duyệt
- [ ] Upload file scan xét nghiệm vào phần Cận lâm sàng (hiện schema đã sẵn `Paraclinical.fileUrl`)
- [ ] Nhập kết quả khám hàng loạt qua form scan OCR
- [ ] Tích hợp chữ ký số PKI chuẩn Ban Cơ yếu Chính phủ (nâng cấp từ signature canvas)
- [ ] Thông báo real-time qua WebSocket khi hồ sơ chuyển trạng thái
- [ ] Dashboard so sánh nhiều đợt khám theo thời gian
- [ ] Xuất báo cáo Excel tổng hợp toàn đơn vị

## Ghi chú kỹ thuật

- **Chữ ký điện tử**: hiện tại dùng canvas signature → PNG base64, lưu trực tiếp trong database. Đây **không** phải chữ ký số có giá trị pháp lý — phù hợp cho quy trình nội bộ. Nếu cần CA chuẩn VNPT-CA, Viettel-CA… cần tích hợp riêng.
- **Ảnh nhân viên**: lưu base64 trực tiếp trong DB. Với quy mô >500 NV nên chuyển sang Vercel Blob / S3 / Cloudflare R2.
- **Phân quyền dữ liệu**: middleware + route guard + check role ở API. Mỗi API đều gọi `requireAuth([...roles])`.
- **Audit log**: mọi thao tác quan trọng (LOGIN, SIGN_EXAM, CONCLUDE, APPROVE…) đều ghi vào bảng `AuditLog`.

## Giấy phép

Dùng nội bộ TTYT khu vực Liên Chiểu.
