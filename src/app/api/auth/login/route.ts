import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    // Rate limit theo IP: 10 lần / 5 phút, vượt quá block 15 phút
    const ipLimit = rateLimit(`login:ip:${ip}`, { max: 10, windowMs: 5 * 60 * 1000, blockMs: 15 * 60 * 1000 });
    if (!ipLimit.allowed) {
      return NextResponse.json({
        error: `Quá nhiều lần thử đăng nhập. Thử lại sau ${Math.ceil((ipLimit.retryAfterMs || 0) / 60000)} phút.`,
      }, { status: 429 });
    }

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Thiếu email/mật khẩu' }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Rate limit theo email: 5 lần / 5 phút (chống brute-force account cụ thể)
    const emailLimit = rateLimit(`login:email:${normalizedEmail}`, { max: 5, windowMs: 5 * 60 * 1000, blockMs: 30 * 60 * 1000 });
    if (!emailLimit.allowed) {
      return NextResponse.json({
        error: `Tài khoản này đã bị tạm khóa do nhiều lần sai mật khẩu. Thử lại sau ${Math.ceil((emailLimit.retryAfterMs || 0) / 60000)} phút.`,
      }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Always-verify để tránh user enumeration timing attack
    const hashToCheck = user?.passwordHash || '$2a$10$invalidHashOfFixedLengthForTiming123456789012345abcdefg';
    const ok = await verifyPassword(password, hashToCheck);

    if (!user || !user.isActive || !ok) {
      await prisma.auditLog.create({
        data: {
          userId: user?.id || 'unknown',
          action: 'LOGIN_FAILED',
          detail: JSON.stringify({
            email: normalizedEmail,
            ip,
            reason: !user ? 'NO_USER' : !user.isActive ? 'INACTIVE' : 'BAD_PASSWORD',
          }),
        },
      }).catch(() => {});
      // Trả response chung, không tiết lộ user tồn tại hay không
      return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng' }, { status: 401 });
    }

    await createSession({
      sub: user.id, email: user.email, role: user.role, fullName: user.fullName,
    });
    await prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN', detail: JSON.stringify({ ip }) },
    }).catch(() => {});

    return NextResponse.json({ ok: true, role: user.role });
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
