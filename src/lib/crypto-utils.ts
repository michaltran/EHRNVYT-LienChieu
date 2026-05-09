import crypto from 'crypto';

/**
 * Mã hoá AES-256-GCM cho dữ liệu nhạy cảm (mật khẩu SmartCA, TOTP secret).
 */

function getKey(): Buffer {
  const secret = process.env.AUTH_SECRET || 'dev-secret-change-me-in-production-please-min32';
  return crypto.createHash('sha256').update(secret).digest();
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decrypt(ciphertext: string): string {
  const [ivB64, tagB64, dataB64] = ciphertext.split('.');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Invalid ciphertext format');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const key = getKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString('utf8');
}

// ============ TOTP RFC 6238 ============

function totpFromBytes(secret: Buffer, timestamp?: number): string {
  const now = timestamp ?? Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / 30);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(counterBuf);
  const hash = hmac.digest();

  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  return (binary % 1_000_000).toString().padStart(6, '0');
}

/**
 * Trả về danh sách OTP candidates theo các format decode khác nhau × cửa sổ thời gian (T-1, T, T+1).
 * RFC 6238 cho phép server tolerance ±1 step để bù time drift.
 * Dùng khi không chắc VNPT mã hoá secret theo format nào — thử lần lượt.
 */
export function generateTotpCandidates(secretInput: string, timestamp?: number): Array<{ name: string; otp: string }> {
  const trimmed = secretInput.replace(/\s+/g, '');
  const formats: Array<{ name: string; bytes: Buffer }> = [];

  try {
    const b64 = Buffer.from(trimmed, 'base64');
    const ascii = b64.toString('ascii');
    if (/^[0-9A-Fa-f]+$/.test(ascii) && ascii.length % 2 === 0) {
      formats.push({ name: 'base64-then-hex', bytes: Buffer.from(ascii, 'hex') });
    }
  } catch {}

  try {
    const b = Buffer.from(trimmed, 'base64');
    if (b.length > 0) formats.push({ name: 'base64-raw', bytes: b });
  } catch {}

  try {
    const b = base32Decode(trimmed.toUpperCase().replace(/=+$/, ''));
    if (b.length > 0) formats.push({ name: 'base32', bytes: b });
  } catch {}

  if (/^[0-9A-Fa-f]+$/.test(trimmed) && trimmed.length % 2 === 0) {
    formats.push({ name: 'hex', bytes: Buffer.from(trimmed, 'hex') });
  }

  formats.push({ name: 'utf8-raw', bytes: Buffer.from(trimmed, 'utf8') });

  // Dedup formats theo bytes
  const seen = new Set<string>();
  const uniqueFormats = formats.filter((c) => {
    const key = c.bytes.toString('hex');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sinh OTP cho 3 cửa sổ × N format. Ưu tiên cửa sổ hiện tại, rồi tới quá khứ, rồi tương lai.
  const now = timestamp ?? Math.floor(Date.now() / 1000);
  const candidates: Array<{ name: string; otp: string }> = [];

  for (const f of uniqueFormats) {
    candidates.push({ name: `${f.name}@T`, otp: totpFromBytes(f.bytes, now) });
  }
  for (const f of uniqueFormats) {
    candidates.push({ name: `${f.name}@T-1`, otp: totpFromBytes(f.bytes, now - 30) });
  }
  for (const f of uniqueFormats) {
    candidates.push({ name: `${f.name}@T+1`, otp: totpFromBytes(f.bytes, now + 30) });
  }

  // Dedup OTP (vd format A và B vô tình ra cùng OTP) - giữ thứ tự ưu tiên ban đầu
  const otpSeen = new Set<string>();
  return candidates.filter((c) => {
    if (otpSeen.has(c.otp)) return false;
    otpSeen.add(c.otp);
    return true;
  });
}

/**
 * Sinh TOTP với 1 format cụ thể (đã biết). Dùng khi đã xác định format đúng.
 */
export function generateTotpWithFormat(secretInput: string, format: string, timestamp?: number): string {
  const cands = generateTotpCandidates(secretInput, timestamp);
  const found = cands.find((c) => c.name === format);
  if (found) return found.otp;
  // Fallback: dùng candidate đầu tiên
  return cands[0]?.otp ?? '000000';
}

/**
 * Sinh TOTP — dùng candidate đầu tiên (base64-then-hex hoặc base64-raw).
 * Khuyến nghị dùng generateTotpCandidates để thử nhiều format.
 */
export function generateTotp(secretInput: string, timestamp?: number): string {
  const cands = generateTotpCandidates(secretInput, timestamp);
  return cands[0]?.otp ?? '000000';
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
