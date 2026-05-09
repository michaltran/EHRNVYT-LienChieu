import { NextResponse } from 'next/server';
import { readFile } from '@/lib/local-storage';
import { requireAuth } from '@/lib/auth';

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  txt: 'text/plain; charset=utf-8',
};

export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rel = params.path.join('/');
  const buf = await readFile(rel);
  if (!buf) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const ext = rel.split('.').pop()?.toLowerCase() || '';
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
