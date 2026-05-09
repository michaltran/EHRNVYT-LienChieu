import Link from 'next/link';

export const metadata = { title: 'Chính sách bảo mật — TTYT Liên Chiểu' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white py-10 px-4">
      <div className="max-w-3xl mx-auto prose prose-slate text-sm">
        <Link href="/login" className="text-brand-600 hover:underline">← Đăng nhập</Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-800">Chính sách bảo mật thông tin</h1>
        <p className="text-slate-500 italic">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>

        <h2 className="text-lg font-bold mt-6">1. Phạm vi áp dụng</h2>
        <p>Hệ thống Quản lý Hồ sơ Sức khỏe Định kỳ (sau đây gọi là "Hệ thống") của Trung tâm Y tế khu vực Liên Chiểu được sử dụng nội bộ phục vụ công tác khám sức khỏe định kỳ cho cán bộ, viên chức, người lao động.</p>

        <h2 className="text-lg font-bold mt-6">2. Dữ liệu thu thập</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Thông tin cá nhân nhân viên: họ tên, ngày sinh, CCCD, địa chỉ, số điện thoại</li>
          <li>Thông tin nghề nghiệp: chức vụ, khoa/phòng, loại hợp đồng</li>
          <li>Thông tin sức khỏe: kết quả khám lâm sàng, cận lâm sàng, phân loại sức khỏe</li>
          <li>Dữ liệu chữ ký điện tử và chữ ký số (VNPT SmartCA)</li>
        </ul>

        <h2 className="text-lg font-bold mt-6">3. Mục đích sử dụng</h2>
        <p>Dữ liệu chỉ phục vụ:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Lập sổ KSK định kỳ theo Mẫu 03 — Thông tư 32/2023/TT-BYT</li>
          <li>Theo dõi sức khỏe nhân viên qua các năm</li>
          <li>Báo cáo thống kê theo yêu cầu của Sở Y tế</li>
        </ul>

        <h2 className="text-lg font-bold mt-6">4. Biện pháp bảo vệ</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Truyền tải mã hóa qua HTTPS/TLS 1.3 (Cloudflare)</li>
          <li>Mật khẩu mã hóa bcrypt; mật khẩu SmartCA mã hóa AES-256-GCM</li>
          <li>Phân quyền 8 vai trò; chỉ người có thẩm quyền truy cập</li>
          <li>Nhật ký hoạt động (audit log) toàn hệ thống</li>
          <li>Sao lưu dữ liệu định kỳ</li>
          <li>Rate limiting + chống brute-force tài khoản</li>
        </ul>

        <h2 className="text-lg font-bold mt-6">5. Chia sẻ dữ liệu</h2>
        <p>Hệ thống <strong>không</strong> chia sẻ dữ liệu cá nhân với bên thứ ba ngoài:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>VNPT-CA (chỉ hash SHA-256 nội dung khi ký số, không gửi nội dung gốc)</li>
          <li>Cơ quan chức năng theo yêu cầu pháp luật</li>
        </ul>

        <h2 className="text-lg font-bold mt-6">6. Quyền của người dùng</h2>
        <p>Theo Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân, bạn có quyền:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Truy cập, xem dữ liệu cá nhân của mình</li>
          <li>Yêu cầu chỉnh sửa nếu thông tin không chính xác</li>
          <li>Yêu cầu xóa dữ liệu khi không còn cần thiết (trừ dữ liệu phải lưu trữ theo luật)</li>
          <li>Khiếu nại nếu phát hiện dữ liệu bị sử dụng sai mục đích</li>
        </ul>

        <h2 className="text-lg font-bold mt-6">7. Liên hệ</h2>
        <p>Mọi thắc mắc liên hệ bộ phận quản trị hệ thống: <a className="text-brand-600" href="mailto:lienhe@ttytlienchieu.vn">lienhe@ttytlienchieu.vn</a> hoặc 0236 384 1234.</p>
      </div>
    </div>
  );
}
