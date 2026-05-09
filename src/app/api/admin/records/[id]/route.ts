import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/** DELETE /api/admin/records/[id] — xóa 1 hồ sơ + cascade ExamClinical + Paraclinical */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const s = await requireAuth(['ADMIN']);
    const rec = await prisma.healthRecord.findUnique({
      where: { id: params.id },
      include: {
        employee: { select: { fullName: true } },
        examRound: { select: { name: true } },
        _count: { select: { clinicalExams: true, paraclinicals: true } },
      },
    });
    if (!rec) return NextResponse.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.examClinical.deleteMany({ where: { recordId: params.id } });
      await tx.paraclinical.deleteMany({ where: { recordId: params.id } });
      await tx.healthRecord.delete({ where: { id: params.id } });
    });

    await prisma.auditLog.create({
      data: {
        userId: s.sub,
        action: 'DELETE_RECORD',
        target: params.id,
        detail: JSON.stringify({
          employee: rec.employee.fullName,
          round: rec.examRound.name,
          examsDeleted: rec._count.clinicalExams,
          clsDeleted: rec._count.paraclinicals,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      message: `Đã xóa hồ sơ ${rec.employee.fullName} (${rec._count.clinicalExams} kết quả khám + ${rec._count.paraclinicals} CLS)`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
