import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/** DELETE /api/admin/rounds/[id] — xóa đợt khám + tất cả hồ sơ thuộc đợt đó (cascade) */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['ADMIN']);
    const round = await prisma.examRound.findUnique({
      where: { id: params.id },
      include: { _count: { select: { healthRecords: true } } },
    });
    if (!round) return NextResponse.json({ error: 'Không tìm thấy đợt khám' }, { status: 404 });

    // Xóa cascade: ExamClinical, Paraclinical, HealthRecord, ExamRound
    await prisma.$transaction(async (tx) => {
      const records = await tx.healthRecord.findMany({
        where: { examRoundId: params.id },
        select: { id: true },
      });
      const recordIds = records.map((r) => r.id);
      if (recordIds.length > 0) {
        await tx.examClinical.deleteMany({ where: { recordId: { in: recordIds } } });
        await tx.paraclinical.deleteMany({ where: { recordId: { in: recordIds } } });
        await tx.healthRecord.deleteMany({ where: { id: { in: recordIds } } });
      }
      await tx.examRound.delete({ where: { id: params.id } });
    });

    return NextResponse.json({
      ok: true,
      message: `Đã xóa đợt "${round.name}" và ${round._count.healthRecords} hồ sơ liên quan`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** PATCH — đổi tên / năm / trạng thái */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(['ADMIN']);
    const data = await req.json();
    const updated = await prisma.examRound.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.year !== undefined && { year: Number(data.year) }),
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
