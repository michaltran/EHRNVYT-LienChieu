import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// Giới hạn kích thước file (10MB)
const MAX_SIZE = 10 * 1024 * 1024;

/**
 * POST multipart/form-data với:
 *   recordId (string)
 *   category (string) - VD: "Công thức máu", "Sinh hóa"
 *   testName (string)
 *   result (string) - kết quả text
 *   evaluation (string) - đánh giá
 *   note (string)
 *   file (File, optional) - PDF/JPG/PNG kết quả scan
 */
export async function POST(req: Request) {
  try {
    await requireAuth(['DOCTOR', 'ADMIN']);

    const formData = await req.formData();
    const recordId = formData.get('recordId') as string;
    const category = formData.get('category') as string;
    const testName = formData.get('testName') as string;
    const result = formData.get('result') as string;
    const evaluation = formData.get('evaluation') as string;
    const note = formData.get('note') as string;
    const file = formData.get('file') as File | null;

    if (!recordId || !category) {
      return NextResponse.json({ error: 'Thiếu recordId hoặc category' }, { status: 400 });
    }

    let fileUrl: string | null = null;
    let fileName: string | null = null;

    // Upload file lên Vercel Blob nếu có
    if (file && file.size > 0) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: 'File vượt quá 10MB' }, { status: 400 });
      }

      // Nếu không có token → lưu base64 vào DB (fallback cho dev local)
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        const buf = Buffer.from(await file.arrayBuffer());
        fileUrl = `data:${file.type};base64,${buf.toString('base64')}`;
        fileName = file.name;
      } else {
        const ext = file.name.split('.').pop() || 'bin';
        const safeName = `paraclinical/${recordId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const blob = await put(safeName, file, { access: 'public' });
        fileUrl = blob.url;
        fileName = file.name;
      }
    }

    const created = await prisma.paraclinical.create({
      data: {
        recordId,
        category,
        testName: testName || category,
        result: result || null,
        evaluation: evaluation || null,
        note: note || null,
        fileUrl,
        fileName,
      },
    });

    return NextResponse.json({ ok: true, id: created.id, fileUrl, fileName });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAuth(['DOCTOR', 'ADMIN']);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 });
    await prisma.paraclinical.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
