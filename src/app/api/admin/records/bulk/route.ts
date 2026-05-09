import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

/** DELETE bulk — body: { ids: string[] } | { roundId: string } | { all: true } */
export async function DELETE(req: Request) {
  try {
    const s = await requireAuth(['ADMIN']);
    const body = await req.json().catch(() => ({}));

    let ids: string[] = [];
    if (Array.isArray(body.ids) && body.ids.length > 0) {
      ids = body.ids;
    } else if (body.roundId) {
      const recs = await prisma.healthRecord.findMany({
        where: { examRoundId: body.roundId },
        select: { id: true },
      });
      ids = recs.map((r) => r.id);
    } else if (body.all === true) {
      const recs = await prisma.healthRecord.findMany({ select: { id: true } });
      ids = recs.map((r) => r.id);
    }

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Không có hồ sơ nào để xóa' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const examsDeleted = await tx.examClinical.deleteMany({ where: { recordId: { in: ids } } });
      const clsDeleted = await tx.paraclinical.deleteMany({ where: { recordId: { in: ids } } });
      const recsDeleted = await tx.healthRecord.deleteMany({ where: { id: { in: ids } } });
      return {
        records: recsDeleted.count,
        exams: examsDeleted.count,
        cls: clsDeleted.count,
      };
    });

    await prisma.auditLog.create({
      data: {
        userId: s.sub,
        action: 'BULK_DELETE_RECORDS',
        detail: JSON.stringify({ ...result, ids: ids.slice(0, 50), idsCount: ids.length }),
      },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      ...result,
      message: `Đã xóa ${result.records} hồ sơ, ${result.exams} kết quả khám, ${result.cls} CLS`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
