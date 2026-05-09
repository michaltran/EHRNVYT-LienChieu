/** Footer chuẩn cho cơ sở y tế: thông tin liên hệ + liên kết + tuyên bố pháp lý */
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white no-print">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
        {/* Cột 1: Thông tin tổ chức */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <div className="font-bold text-slate-800 text-sm leading-tight">
                Trung tâm Y tế khu vực Liên Chiểu
              </div>
              <div className="text-[10px] text-slate-500">Đà Nẵng</div>
            </div>
          </div>
          <p className="leading-relaxed">
            Đơn vị sự nghiệp y tế công lập trực thuộc Sở Y tế TP. Đà Nẵng,
            phục vụ chăm sóc sức khỏe ban đầu cho người dân khu vực Liên Chiểu.
          </p>
        </div>

        {/* Cột 2: Liên hệ */}
        <div>
          <h3 className="font-semibold text-slate-800 mb-2">Liên hệ</h3>
          <ul className="space-y-1.5">
            <li className="flex gap-2">
              <span className="text-slate-400">📍</span>
              <span>123 Nguyễn Sinh Sắc, P. Hòa Khánh Nam, Q. Liên Chiểu, TP. Đà Nẵng</span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400">☎</span>
              <a href="tel:02363841234" className="hover:text-brand-600">0236 384 1234</a>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400">✉</span>
              <a href="mailto:lienhe@ttytlienchieu.vn" className="hover:text-brand-600">lienhe@ttytlienchieu.vn</a>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400">🕐</span>
              <span>Thứ 2 - Thứ 6: 7:30 - 16:30</span>
            </li>
          </ul>
        </div>

        {/* Cột 3: Pháp lý / hệ thống */}
        <div>
          <h3 className="font-semibold text-slate-800 mb-2">Hệ thống & Bảo mật</h3>
          <ul className="space-y-1.5">
            <li className="flex items-start gap-1.5">
              <span className="text-green-600">🔒</span>
              <span>Kết nối được mã hóa HTTPS/TLS 1.3 qua Cloudflare</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-green-600">🛡</span>
              <span>Tuân thủ TT 32/2023/TT-BYT về hồ sơ KSK</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-green-600">✓</span>
              <span>Ký số VNPT SmartCA — pháp lý theo Luật GDĐT 2005</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-amber-600">⚠</span>
              <span>Thông tin cá nhân được bảo vệ theo Nghị định 13/2023/NĐ-CP</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-slate-200 bg-slate-50 px-4 md:px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div>
            © {year} TTYT khu vực Liên Chiểu • Phiên bản 1.0 • Software Powered by Dat Dat
          </div>
          <div className="flex gap-3">
            <a href="/privacy" className="hover:text-brand-600">Chính sách bảo mật</a>
            <span className="text-slate-300">|</span>
            <a href="/terms" className="hover:text-brand-600">Điều khoản sử dụng</a>
            <span className="text-slate-300">|</span>
            <span title="Không lưu cookie tracking, không sử dụng analytics bên thứ 3">
              Không tracking
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
