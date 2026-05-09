import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await requireAuth(['ADMIN']);
    const { rows } = await req.json();
    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }

    const deptCache: Record<string, string> = {};
    let created = 0, updated = 0, skipped = 0;

    for (const r of rows) {
      if (!r.fullName || !r.department) { skipped++; continue; }

      let deptId = deptCache[r.department];
      if (!deptId) {
        const d = await prisma.department.upsert({
          where: { name: r.department },
          update: {},
          create: { name: r.department },
        });
        deptId = d.id;
        deptCache[r.department] = deptId;
      }

      const dob = r.dateOfBirth ? new Date(r.dateOfBirth)
        : r.birthYear ? new Date(r.birthYear, 0, 1)
        : null;

      const payload = {
        gender: r.gender,
        dateOfBirth: dob,
        departmentId: deptId,
        position: r.position ?? null,
        qualification: r.qualification ?? null,
        jobTitle: r.jobTitle ?? null,
        employmentType: r.employmentType ?? null,
        idNumber: r.idNumber ?? null,
        idIssuedDate: r.idIssuedDate ? new Date(r.idIssuedDate) : null,
        idIssuedPlace: r.idIssuedPlace ?? null,
        currentAddress: r.currentAddress ?? null,
        phone: r.phone ?? null,
        occupation: r.occupation ?? null,
        workplace: r.workplace ?? 'Trung tâm Y tế khu vực Liên Chiểu',
        startWorkingDate: r.startWorkingDate ? new Date(r.startWorkingDate) : null,
        familyHistory: r.familyHistory ?? null,
        signatureUrl: r.signatureUrl ?? null,
      };

      const existing = await prisma.employee.findFirst({
        where: { fullName: r.fullName, departmentId: deptId },
      });

      if (existing) {
        await prisma.employee.update({ where: { id: existing.id }, data: payload });
        updated++;
      } else {
        await prisma.employee.create({ data: { fullName: r.fullName, ...payload } });
        created++;
      }
    }

    return NextResponse.json({ created, updated, skipped });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** DELETE bulk - body: { ids: string[] } hoặc { departmentId: string } để xóa cả khoa */
export async function DELETE(req: Request) {
  try {
    const s = await requireAuth(['ADMIN']);
    const { ids, departmentId } = await req.json();

    let targetIds: string[] = Array.isArray(ids) ? ids : [];
    if (!targetIds.length && departmentId) {
      const all = await prisma.employee.findMany({
        where: { departmentId },
        select: { id: true },
      });
      targetIds = all.map((e) => e.id);
    }
    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'Không có nhân viên nào để xóa' }, { status: 400 });
    }

    // Xóa cascade thủ công: ExamClinical + Paraclinical + HealthRecord + User.employeeId set null + Employee
    const result = await prisma.$transaction(async (tx) => {
      const records = await tx.healthRecord.findMany({
        where: { employeeId: { in: targetIds } },
        select: { id: true },
      });
      const recordIds = records.map((r) => r.id);

      if (recordIds.length > 0) {
        await tx.examClinical.deleteMany({ where: { recordId: { in: recordIds } } });
        await tx.paraclinical.deleteMany({ where: { recordId: { in: recordIds } } });
        await tx.healthRecord.deleteMany({ where: { id: { in: recordIds } } });
      }

      // Bỏ liên kết User.employeeId nếu có
      await tx.user.updateMany({
        where: { employeeId: { in: targetIds } },
        data: { employeeId: null },
      });

      const deleted = await tx.employee.deleteMany({ where: { id: { in: targetIds } } });
      return { deleted: deleted.count, recordsDeleted: recordIds.length };
    });

    await prisma.auditLog.create({
      data: {
        userId: s.sub,
        action: 'BULK_DELETE_EMPLOYEES',
        detail: JSON.stringify({ ids: targetIds.slice(0, 50), count: targetIds.length, ...result }),
      },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      deleted: result.deleted,
      recordsDeleted: result.recordsDeleted,
      message: `Đã xóa ${result.deleted} nhân viên và ${result.recordsDeleted} hồ sơ liên quan`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
