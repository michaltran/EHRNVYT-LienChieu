import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const PG_DUMP_PATH = process.env.PG_DUMP_PATH || 'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe';

/** GET /api/admin/backup → trả về file .sql backup database */
export async function GET() {
  try {
    const s = await requireAuth(['ADMIN']);

    // Parse DATABASE_URL
    const dbUrl = process.env.DATABASE_URL || '';
    const m = dbUrl.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:/]+):(\d+)\/([^?]+)/);
    if (!m) return NextResponse.json({ error: 'DATABASE_URL không hợp lệ' }, { status: 500 });
    const [, dbUser, dbPass, dbHost, dbPort, dbName] = m;
    const password = decodeURIComponent(dbPass);

    // Check pg_dump tồn tại
    try {
      await fs.access(PG_DUMP_PATH);
    } catch {
      return NextResponse.json({
        error: `Không tìm thấy pg_dump tại ${PG_DUMP_PATH}. Set env PG_DUMP_PATH.`,
      }, { status: 500 });
    }

    // Run pg_dump
    const sql = await new Promise<string>((resolve, reject) => {
      const proc = spawn(PG_DUMP_PATH, [
        '-h', dbHost, '-p', dbPort, '-U', dbUser, '-d', decodeURIComponent(dbName),
        '--no-owner', '--no-privileges',
        '--clean', '--if-exists',
        '--encoding=UTF8',
      ], {
        env: { ...process.env, PGPASSWORD: password },
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (chunk) => { stdout += chunk.toString('utf8'); });
      proc.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });
      proc.on('error', reject);
      proc.on('close', (code) => {
        if (code === 0) resolve(stdout);
        else reject(new Error(`pg_dump exit ${code}: ${stderr.slice(0, 500)}`));
      });
    });

    await prisma.auditLog.create({
      data: { userId: s.sub, action: 'DB_BACKUP', detail: `size=${sql.length} bytes` },
    }).catch(() => {});

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `ehr_lienchieu_backup_${ts}.sql`;
    return new NextResponse(sql, {
      headers: {
        'Content-Type': 'application/sql; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** POST → tạo backup file vào server (./backups/) */
export async function POST() {
  try {
    const s = await requireAuth(['ADMIN']);
    const dbUrl = process.env.DATABASE_URL || '';
    const m = dbUrl.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:/]+):(\d+)\/([^?]+)/);
    if (!m) return NextResponse.json({ error: 'DATABASE_URL không hợp lệ' }, { status: 500 });
    const [, dbUser, dbPass, dbHost, dbPort, dbName] = m;
    const password = decodeURIComponent(dbPass);

    const backupDir = path.resolve('./backups');
    await fs.mkdir(backupDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `ehr_lienchieu_backup_${ts}.sql`;
    const filepath = path.join(backupDir, filename);

    await new Promise<void>((resolve, reject) => {
      const fd = require('fs').createWriteStream(filepath);
      const proc = spawn(PG_DUMP_PATH, [
        '-h', dbHost, '-p', dbPort, '-U', dbUser, '-d', decodeURIComponent(dbName),
        '--no-owner', '--no-privileges', '--clean', '--if-exists', '--encoding=UTF8',
      ], { env: { ...process.env, PGPASSWORD: password }, windowsHide: true });

      proc.stdout.pipe(fd);
      proc.on('error', reject);
      proc.on('close', (code) => code === 0 ? resolve() : reject(new Error(`pg_dump exit ${code}`)));
    });

    const stat = await fs.stat(filepath);
    await prisma.auditLog.create({
      data: { userId: s.sub, action: 'DB_BACKUP_SAVED', detail: `path=${filepath} size=${stat.size}` },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      filename,
      filepath,
      size: stat.size,
      sizeReadable: `${(stat.size / 1024 / 1024).toFixed(2)} MB`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** GET ?list=1 → liệt kê backup đã lưu trên server */
export async function PATCH() {
  try {
    await requireAuth(['ADMIN']);
    const backupDir = path.resolve('./backups');
    try {
      const files = await fs.readdir(backupDir);
      const list = await Promise.all(
        files
          .filter((f) => f.endsWith('.sql'))
          .map(async (f) => {
            const stat = await fs.stat(path.join(backupDir, f));
            return {
              filename: f,
              size: stat.size,
              sizeReadable: `${(stat.size / 1024 / 1024).toFixed(2)} MB`,
              createdAt: stat.mtime.toISOString(),
            };
          }),
      );
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return NextResponse.json({ backups: list });
    } catch {
      return NextResponse.json({ backups: [] });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
