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

      const dob = r.birthYear ? new Date(r.birthYear, 0, 1) : null;

      // Tìm theo fullName + departmentId để tránh trùng
      const existing = await prisma.employee.findFirst({
        where: { fullName: r.fullName, departmentId: deptId },
      });
      if (existing) {
        await prisma.employee.update({
          where: { id: existing.id },
          data: {
            gender: r.gender,
            dateOfBirth: dob,
            position: r.position,
            qualification: r.qualification,
            jobTitle: r.jobTitle,
            employmentType: r.employmentType,
          },
        });
        updated++;
      } else {
        await prisma.employee.create({
          data: {
            fullName: r.fullName,
            gender: r.gender,
            dateOfBirth: dob,
            departmentId: deptId,
            position: r.position,
            qualification: r.qualification,
            jobTitle: r.jobTitle,
            employmentType: r.employmentType,
            workplace: 'Trung tâm Y tế khu vực Liên Chiểu',
          },
        });
        created++;
      }
    }

    return NextResponse.json({ created, updated, skipped });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Lỗi' }, { status: 500 });
  }
}
