import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hashPassword } from '@/lib/auth';
import type { Role } from '@prisma/client';

const VALID_ROLES: Role[] = [
  'ADMIN', 'DOCTOR', 'CONCLUDER', 'DEPT_REP', 'EMPLOYEE',
  'KTV_XETNGHIEM', 'KTV_CHANDOANHINHANH', 'VITAL_STAFF',
];

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const s = await requireAuth(['ADMIN']);
    const data = await req.json();
    const updateData: any = {};

    if (typeof data.password === 'string' && data.password.length > 0) {
      if (data.password.length < 4) {
        return NextResponse.json({ error: 'Mật khẩu tối thiểu 4 ký tự' }, { status: 400 });
      }
      updateData.passwordHash = await hashPassword(data.password);
    }
    if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive;
    if (typeof data.fullName === 'string') updateData.fullName = data.fullName;
    if (typeof data.email === 'string' && data.email.length > 0) {
      updateData.email = data.email.toLowerCase();
    }
    if (typeof data.jobTitle === 'string') updateData.jobTitle = data.jobTitle || null;
    if (typeof data.signatureDataUrl === 'string') updateData.signatureDataUrl = data.signatureDataUrl;
    if (typeof data.departmentId === 'string') updateData.departmentId = data.departmentId || null;
    if (Array.isArray(data.specialties)) {
      updateData.specialties = data.specialties.length > 0 ? JSON.stringify(data.specialties) : null;
    }

    if (typeof data.role === 'string') {
      if (!VALID_ROLES.includes(data.role as Role)) {
        return NextResponse.json({ error: 'Role không hợp lệ' }, { status: 400 });
      }
      // Ngăn admin tự xuống role của chính mình (tránh khoá ngoài hệ thống)
      if (params.id === s.sub && data.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Không thể tự đổi role của chính mình. Nhờ admin khác đổi giúp.' }, { status: 400 });
      }
      updateData.role = data.role;
      // Nếu chuyển sang non-DOCTOR thì xoá specialties
      if (data.role !== 'DOCTOR') updateData.specialties = null;
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, email: true, fullName: true, role: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: s.sub,
        action: 'UPDATE_USER',
        target: params.id,
        detail: JSON.stringify({ fields: Object.keys(updateData) }),
      },
    }).catch(() => {});

    return NextResponse.json({ ok: true, user: updated });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Email đã tồn tại' }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const s = await requireAuth(['ADMIN']);
    if (params.id === s.sub) {
      return NextResponse.json({ error: 'Không thể tự xóa tài khoản của chính mình' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { examsAsDoctor: true, conclusionsSigned: true } },
      },
    });
    if (!user) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });

    // Nếu user đã ký các hồ sơ → chỉ vô hiệu hoá, không xoá để giữ audit
    if (user._count.examsAsDoctor > 0 || user._count.conclusionsSigned > 0) {
      await prisma.user.update({
        where: { id: params.id },
        data: { isActive: false, email: `_deleted_${Date.now()}_${user.email}` },
      });
      return NextResponse.json({
        ok: true,
        soft: true,
        message: 'User đã ký hồ sơ — chỉ vô hiệu hoá để giữ lịch sử ký',
      });
    }

    await prisma.user.delete({ where: { id: params.id } });
    await prisma.auditLog.create({
      data: { userId: s.sub, action: 'DELETE_USER', target: params.id, detail: user.email },
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
