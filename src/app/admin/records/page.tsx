import { prisma } from '@/lib/prisma';
import RecordsClient from './client';

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: { round?: string; status?: string; dept?: string; q?: string };
}) {
  const where: any = {};
  if (searchParams.round) where.examRoundId = searchParams.round;
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.dept) where.employee = { departmentId: searchParams.dept };
  if (searchParams.q) where.employee = { ...(where.employee || {}), fullName: { contains: searchParams.q } };

  const [records, rounds, departments] = await Promise.all([
    prisma.healthRecord.findMany({
      where,
      include: { employee: { include: { department: true } }, examRound: true },
      orderBy: [{ updatedAt: 'desc' }],
      take: 300,
    }),
    prisma.examRound.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <RecordsClient
      records={records.map((r) => ({
        id: r.id,
        employeeName: r.employee.fullName,
        department: r.employee.department.name,
        roundName: r.examRound.name,
        status: r.status,
        finalClassification: r.finalClassification,
        updatedAt: r.updatedAt.toISOString(),
      }))}
      rounds={rounds.map((r) => ({ id: r.id, name: r.name }))}
      departments={departments.map((d) => ({ id: d.id, name: d.name }))}
      currentFilters={{
        round: searchParams.round ?? '',
        status: searchParams.status ?? '',
        dept: searchParams.dept ?? '',
        q: searchParams.q ?? '',
      }}
    />
  );
}
