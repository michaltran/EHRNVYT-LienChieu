import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const s = await requireAuth(['CONCLUDER']);
    const data = await req.json();
    if (!data.signatureDataUrl) return NextResponse.json({ error: 'Thiếu chữ ký' }, { status: 400 });

    await prisma.healthRecord.update({
      where: { id: params.id },
      data: {
        finalClassification: data.classification,
        conclusionText: data.conclusionText || null,
        concluderId: s.sub,
        concluderSignedAt: new Date(),
        concluderSignatureDataUrl: data.signatureDataUrl,
        status: 'COMPLETED',
        finalizedAt: new Date(),
      },
    });

    // Lưu chữ ký mẫu nếu chưa có
    const user = await prisma.user.findUnique({ where: { id: s.sub } });
    if (user && !user.signatureDataUrl) {
      await prisma.user.update({
        where: { id: s.sub }, data: { signatureDataUrl: data.signatureDataUrl },
      });
    }

    await prisma.auditLog.create({
      data: { userId: s.sub, action: 'CONCLUDE', target: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
