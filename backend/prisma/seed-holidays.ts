import { prisma } from '../src/prisma';

const holidays = [
  { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'HOLIDAY' },
  { date: '2026-10-20', name: 'Dussehra', type: 'HOLIDAY' },
  { date: '2026-11-09', name: 'Diwali Break', type: 'CAMPUS_CLOSED' },
];

async function main() {
  for (const holiday of holidays) {
    await prisma.academicHoliday.upsert({
      where: { date: holiday.date },
      update: holiday,
      create: holiday,
    });
  }
  console.log(`Seeded ${holidays.length} academic holidays.`);
}

main().finally(() => prisma.$disconnect());
