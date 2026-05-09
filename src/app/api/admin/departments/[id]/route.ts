import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['ADMIN']);
    const data = await req.json();
    const updated = await prisma.department.update({
      where: { id: params.id },
      data: {
        ...(typeof data.name === 'string' && data.name.trim() && { name: data.name.trim() }),
        ...(data.code !== undefined && { code: data.code?.toString().trim() || null }),
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Tên hoặc mã khoa đã tồn tại' }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['ADMIN']);
    const count = await prisma.employee.count({ where: { departmentId: params.id } });
    if (count > 0) {
      return NextResponse.json({ error: `Còn ${count} nhân viên trong khoa này` }, { status: 400 });
    }
    await prisma.department.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
