import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { requestSignTh, confirmSignTh } from '@/lib/vnpt-smartca';
import { decrypt, generateTotpCandidates } from '@/lib/crypto-utils';

/**
 * POST /api/smartca/sign-batch
 *
 * Ký số nhiều mục cùng lúc trong 1 transaction VNPT (tiết kiệm OTP, nhanh).
 * Body: { items: [{ targetType: 'CLINICAL_EXAM' | 'CONCLUSION', targetId, payload, description? }] }
 *
 * Quy trình:
 * 1. Hash từng payload
 * 2. Gọi v2/signatures/sign 1 lần với mảng sign_files
 * 3. Confirm 1 lần → nhận mảng chữ ký
 * 4. Match chữ ký theo doc_id → áp dụng vào từng target
 */
export async function POST(req: Request) {
  try {
    const s = await requireAuth(['DOCTOR', 'CONCLUDER']);
    const user = await prisma.user.findUnique({ where: { id: s.sub } });

    if (!user?.caEnabled || !user.caUserId || !user.caSerialNumber || !user.caPasswordEnc || !user.caTotpSecretEnc) {
      return NextResponse.json({ error: 'Chưa kích hoạt ký số VNPT SmartCA.' }, { status: 400 });
    }

    const { items, signatureImageDataUrl } = await req.json();
    // Ảnh chữ ký để hiển thị cùng dấu CA (lấy từ savedSignature của user nếu client không gửi)
    const sigImage: string | null = signatureImageDataUrl || user.signatureDataUrl || null;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Thiếu items' }, { status: 400 });
    }
    if (items.length > 30) {
      return NextResponse.json({ error: 'Tối đa 30 mục/lần ký' }, { status: 400 });
    }

    let password: string, totpSecret: string;
    try {
      password = decrypt(user.caPasswordEnc);
      totpSecret = decrypt(user.caTotpSecretEnc);
    } catch {
      return NextResponse.json({ error: 'Lỗi giải mã credentials, vui lòng kích hoạt lại SmartCA' }, { status: 500 });
    }

    // Build sign_files với doc_id duy nhất theo targetId
    const ts = Date.now();
    const itemsWithMeta = items.map((it: any, idx: number) => {
      const hash = crypto.createHash('sha256').update(it.payload || '').digest('hex');
      const safeId = String(it.targetId).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 24);
      const docId = `${idx}_${safeId}_${ts}`;
      return { ...it, hash, docId };
    });

    // Thử các OTP candidate
    const otpCands = generateTotpCandidates(totpSecret);
    let signResp: any = null;
    let workingFormat = '';
    const errors: string[] = [];

    for (const cand of otpCands) {
      const txId = `BATCH_${s.sub.slice(0, 8)}_${ts}_${cand.name.slice(0, 4)}`;
      try {
        signResp = await requestSignTh({
          userCccd: user.caUserId,
          userPassword: password,
          otp: cand.otp,
          transactionId: txId,
          transactionDesc: `Ký lô ${itemsWithMeta.length} mục - ${user.fullName}`,
          serialNumber: user.caSerialNumber,
          files: itemsWithMeta.map((it) => ({
            doc_id: it.docId,
            data_to_be_signed: it.hash,
            file_type: 'pdf',
            sign_type: 'hash',
          })),
        });
        workingFormat = cand.name;
        break;
      } catch (e: any) {
        const msg = e.message || String(e);
        errors.push(`[${cand.name}] ${msg}`);
        const lower = msg.toLowerCase();
        if (!lower.includes('otp') && !lower.includes('credential')) break;
      }
    }

    if (!signResp) {
      return NextResponse.json({
        error: `Đã thử ${otpCands.length} format. Lỗi cuối: ${errors[errors.length - 1]}`,
      }, { status: 500 });
    }

    // Confirm
    let confirmResp: any;
    try {
      confirmResp = await confirmSignTh({
        userCccd: user.caUserId,
        userPassword: password,
        sad: signResp.sad,
        transactionId: signResp.transaction_id,
      });
    } catch (e: any) {
      return NextResponse.json({ error: `Lỗi xác nhận: ${e.message}` }, { status: 500 });
    }

    const signatures: Array<{ doc_id: string; signature_value: string }> = confirmResp.signatures || [];
    const sigByDocId = new Map(signatures.map((s) => [s.doc_id, s.signature_value]));

    // Áp dụng từng chữ ký
    const applied: Array<{ targetId: string; ok: boolean; error?: string }> = [];
    const now = new Date();

    for (const it of itemsWithMeta) {
      const sigValue = sigByDocId.get(it.docId);
      if (!sigValue) {
        applied.push({ targetId: it.targetId, ok: false, error: 'VNPT không trả về chữ ký cho mục này' });
        continue;
      }

      // Lưu transaction record
      await prisma.caSignTransaction.create({
        data: {
          userId: s.sub,
          targetType: it.targetType,
          targetId: it.targetId,
          docId: it.docId,
          tranCode: signResp.tran_code,
          vnptTranId: signResp.transaction_id,
          status: 'COMPLETED',
          dataHash: it.hash,
          signatureValue: sigValue,
          completedAt: now,
        },
      }).catch(() => {});

      try {
        if (it.targetType === 'CLINICAL_EXAM') {
          let recordId = it.targetId;
          let specialty: any = null;
          if (String(it.targetId).includes('::')) {
            [recordId, specialty] = String(it.targetId).split('::');
          }
          if (specialty) {
            await prisma.examClinical.upsert({
              where: { recordId_specialty: { recordId, specialty } },
              create: {
                recordId, specialty,
                findings: it.findings || 'Bình thường',
                classification: it.classification || 'Loại I',
                signedAt: now,
                signatureDataUrl: sigImage ? `CA:${sigValue}|||IMG:${sigImage}` : `CA:${sigValue}`,
                doctorId: s.sub,
                doctorNameSnapshot: user.fullName,
                doctorTitleSnapshot: user.jobTitle,
              },
              update: {
                ...(it.findings && { findings: it.findings }),
                ...(it.classification && { classification: it.classification }),
                signedAt: now,
                signatureDataUrl: sigImage ? `CA:${sigValue}|||IMG:${sigImage}` : `CA:${sigValue}`,
                doctorId: s.sub,
                doctorNameSnapshot: user.fullName,
                doctorTitleSnapshot: user.jobTitle,
              },
            });
          } else {
            await prisma.examClinical.update({
              where: { id: it.targetId },
              data: {
                signedAt: now,
                signatureDataUrl: sigImage ? `CA:${sigValue}|||IMG:${sigImage}` : `CA:${sigValue}`,
                doctorId: s.sub,
                doctorNameSnapshot: user.fullName,
                doctorTitleSnapshot: user.jobTitle,
              },
            });
          }
        } else if (it.targetType === 'CONCLUSION') {
          await prisma.healthRecord.update({
            where: { id: it.targetId },
            data: {
              concluderSignedAt: now,
              concluderSignatureDataUrl: `CA:${sigValue}`,
              concluderId: s.sub,
              concluderNameSnapshot: user.fullName,
              concluderTitleSnapshot: user.jobTitle,
              status: 'COMPLETED',
              finalizedAt: now,
            },
          });
        }
        applied.push({ targetId: it.targetId, ok: true });
      } catch (e: any) {
        applied.push({ targetId: it.targetId, ok: false, error: e.message });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: s.sub,
        action: 'SMARTCA_TH_BATCH_SIGNED',
        detail: JSON.stringify({ count: items.length, format: workingFormat, vnptTranId: signResp.transaction_id }),
      },
    }).catch(() => {});

    const okCount = applied.filter((a) => a.ok).length;
    return NextResponse.json({
      ok: okCount === items.length,
      total: items.length,
      success: okCount,
      failed: items.length - okCount,
      vnptTranId: signResp.transaction_id,
      applied,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Lỗi' }, { status: 500 });
  }
}
