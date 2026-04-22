import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  try {
    const adminPass = await hashPassword('admin123');
    const doctorPass = await hashPassword('doctor123');
    const concludePass = await hashPassword('conclude123');

    const accounts = [
      { email: 'admin@lienchieu.vn', pass: adminPass, name: 'Quản trị viên hệ thống', role: 'ADMIN' as const, specs: null, title: null },
      { email: 'giamdoc@lienchieu.vn', pass: concludePass, name: 'BS. Giám đốc', role: 'CONCLUDER' as const, specs: null, title: 'Giám đốc TTYT Liên Chiểu' },
      { email: 'bs.noikhoa@lienchieu.vn', pass: doctorPass, name: 'BS. Nội khoa', role: 'DOCTOR' as const,
        specs: ['NOI_TUAN_HOAN','NOI_HO_HAP','NOI_TIEU_HOA','NOI_THAN_TIET_NIEU','NOI_TIET','CO_XUONG_KHOP','THAN_KINH','TAM_THAN'], title: 'BS CKI - Khoa Nội' },
      { email: 'bs.ngoai@lienchieu.vn', pass: doctorPass, name: 'BS. Ngoại khoa', role: 'DOCTOR' as const,
        specs: ['NGOAI_KHOA','DA_LIEU'], title: 'BS CKI - Khoa Ngoại' },
      { email: 'bs.sanphu@lienchieu.vn', pass: doctorPass, name: 'BS. Sản phụ khoa', role: 'DOCTOR' as const,
        specs: ['SAN_PHU_KHOA'], title: 'BS CKI - Khoa Phụ sản' },
      { email: 'bs.mat@lienchieu.vn', pass: doctorPass, name: 'BS. Mắt', role: 'DOCTOR' as const,
        specs: ['MAT'], title: 'BS - Khoa Mắt' },
      { email: 'bs.tmh@lienchieu.vn', pass: doctorPass, name: 'BS. Tai-Mũi-Họng', role: 'DOCTOR' as const,
        specs: ['TAI_MUI_HONG'], title: 'BS - Khoa TMH' },
      { email: 'bs.rhm@lienchieu.vn', pass: doctorPass, name: 'BS. Răng-Hàm-Mặt', role: 'DOCTOR' as const,
        specs: ['RANG_HAM_MAT'], title: 'BS - Khoa RHM' },
    ];

    let created = 0;
    for (const a of accounts) {
      const exists = await prisma.user.findUnique({ where: { email: a.email } });
      if (exists) continue;
      await prisma.user.create({
        data: {
          email: a.email,
          passwordHash: a.pass,
          fullName: a.name,
          role: a.role,
          jobTitle: a.title,
          specialties: a.specs ? JSON.stringify(a.specs) : null,
        },
      });
      created++;
    }

    // Tạo một đợt khám mẫu nếu chưa có
    const roundExists = await prisma.examRound.findFirst();
    if (!roundExists) {
      const year = new Date().getFullYear();
      await prisma.examRound.create({
        data: {
          name: `Khám sức khỏe định kỳ ${year}`,
          year,
          startDate: new Date(`${year}-06-01`),
          status: 'DRAFT',
        },
      });
    }

    return NextResponse.json({
      ok: true,
      created,
      message: `Đã tạo ${created} tài khoản mới. Các tài khoản đã tồn tại được giữ nguyên.`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
