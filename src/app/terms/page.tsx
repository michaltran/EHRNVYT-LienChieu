import Link from 'next/link';

export const metadata = { title: 'Điều khoản sử dụng — TTYT Liên Chiểu' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-10 px-4">
      <div className="max-w-3xl mx-auto text-sm">
        <Link href="/login" className="text-brand-600 hover:underline">← Đăng nhập</Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-800">Điều khoản sử dụng</h1>

        <h2 className="text-lg font-bold mt-6">1. Đối tượng sử dụng</h2>
        <p>Hệ thống chỉ được sử dụng bởi cán bộ, nhân viên TTYT khu vực Liên Chiểu có tài khoản hợp lệ.</p>

        <h2 className="text-lg font-bold mt-6">2. Trách nhiệm người dùng</h2>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Bảo mật tài khoản, không chia sẻ mật khẩu</li>
          <li>Đăng xuất khi rời máy tính, đặc biệt máy dùng chung</li>
          <li>Báo cáo ngay với quản trị viên nếu nghi ngờ tài khoản bị xâm nhập</li>
          <li>Không sử dụng sai mục đích hoặc khai thác dữ liệu cá nhân của người khác</li>
          <li>Đảm bảo độ chính xác của thông tin khám và kết luận</li>
        </ul>

        <h2 className="text-lg font-bold mt-6">3. Chữ ký điện tử và pháp lý</h2>
        <p>Chữ ký số VNPT SmartCA tích hợp trong hệ thống có giá trị pháp lý theo Luật Giao dịch điện tử 2005 và Nghị định 130/2018/NĐ-CP về chữ ký số. Chữ ký canvas/upload chỉ có giá trị nội bộ.</p>

        <h2 className="text-lg font-bold mt-6">4. Vi phạm</h2>
        <p>Mọi hành vi truy cập trái phép, làm sai lệch hoặc đánh cắp dữ liệu sẽ bị xử lý theo Bộ luật Hình sự (Điều 286-291 về tội phạm trong lĩnh vực CNTT) và quy chế nội bộ.</p>

        <h2 className="text-lg font-bold mt-6">5. Bảo hành & cập nhật</h2>
        <p>Hệ thống được duy trì và nâng cấp định kỳ. Trong thời gian bảo trì, có thể tạm thời gián đoạn dịch vụ. Quản trị viên sẽ thông báo trước.</p>

        <h2 className="text-lg font-bold mt-6">6. Liên hệ</h2>
        <p><a className="text-brand-600" href="mailto:lienhe@ttytlienchieu.vn">lienhe@ttytlienchieu.vn</a> • 0236 384 1234</p>
      </div>
    </div>
  );
}
