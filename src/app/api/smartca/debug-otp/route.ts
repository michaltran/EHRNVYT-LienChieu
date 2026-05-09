import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { decrypt } from '@/lib/crypto-utils';

/**
 * GET /api/smartca/debug-otp
 *
 * Trả về OTP hiện tại với 4 cách decode TOTP secret khác nhau,
 * giúp xác định format VNPT thực sự dùng. So sánh với app SmartCA
 * trên điện thoại — cách nào trùng → đó là format đúng.
 */
export async function GET() {
  const s = await requireAuth(['DOCTOR', 'CONCLUDER', 'ADMIN']);
  const user = await prisma.user.findUnique({ where: { id: s.sub } });
  if (!user?.caTotpSecretEnc) {
    return NextResponse.json({ error: 'Chưa lưu TOTP secret. Vào /setup hoặc profile để cấu hình.' }, { status: 400 });
  }

  const secret = decrypt(user.caTotpSecretEnc);
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / 30);
  const remaining = 30 - (now % 30);

  const trimmed = secret.replace(/\s+/g, '');

  // 4 cách thử decode secret
  const candidates: Array<{ label: string; bytes: Buffer | null; notes?: string }> = [];

  // 1. Hiện tại: base64 → ASCII là hex → hex decode (16 bytes)
  try {
    const b64 = Buffer.from(trimmed, 'base64');
    const ascii = b64.toString('ascii');
    if (/^[0-9A-Fa-f]+$/.test(ascii) && ascii.length % 2 === 0) {
      candidates.push({ label: 'A. base64 → ASCII hex string → hex decode', bytes: Buffer.from(ascii, 'hex'), notes: 'Cách hiện tại' });
    } else {
      candidates.push({ label: 'A. base64 → ASCII hex string → hex decode', bytes: null, notes: 'Không áp dụng' });
    }
  } catch { candidates.push({ label: 'A.', bytes: null }); }

  // 2. base64 decode bytes trực tiếp
  try {
    candidates.push({ label: 'B. base64 decode trực tiếp', bytes: Buffer.from(trimmed, 'base64') });
  } catch { candidates.push({ label: 'B.', bytes: null }); }

  // 3. base32 (uppercase + bỏ =)
  try {
    candidates.push({
      label: 'C. base32 uppercase',
      bytes: base32Decode(trimmed.toUpperCase().replace(/=+$/, '')),
    });
  } catch { candidates.push({ label: 'C.', bytes: null }); }

  // 4. raw string as bytes
  candidates.push({ label: 'D. Chuỗi gốc làm bytes (UTF-8)', bytes: Buffer.from(trimmed, 'utf8') });

  const otps = candidates.map((c) => ({
    label: c.label,
    notes: c.notes,
    bytesLength: c.bytes ? c.bytes.length : null,
    bytesHex: c.bytes ? c.bytes.toString('hex').slice(0, 32) + (c.bytes.length > 16 ? '...' : '') : null,
    otp: c.bytes ? totp(c.bytes, counter) : null,
  }));

  return NextResponse.json({
    serverTime: new Date().toISOString(),
    serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    counter,
    secondsRemainingInWindow: remaining,
    secretRaw: trimmed,
    candidates: otps,
    instructions:
      '1. Mở app VNPT SmartCA trên điện thoại đã đăng ký TOTP cùng tài khoản. ' +
      '2. So sánh OTP đang hiển thị với 4 giá trị bên trên (chú ý còn ' + remaining + 's nữa đổi). ' +
      '3. Cách nào cho OTP trùng → đó là format đúng. Báo lại để tôi cập nhật code.',
  });
}

function totp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter), 0);
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(buf);
  const hash = hmac.digest();
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  return (binary % 1_000_000).toString().padStart(6, '0');
}

function base32Decode(str: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes: number[] = [];
  let buffer = 0, bits = 0;
  for (const c of str) {
    const idx = alphabet.indexOf(c);
    if (idx < 0) continue;
    buffer = (buffer << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return Buffer.from(bytes);
}
