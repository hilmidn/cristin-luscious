import "server-only";

import { getPrisma } from "./prisma";

/**
 * Ringkasan visitor tracker untuk dashboard admin. Semua data anonim
 * (tanpa IP/PII): agregat per hari, halaman teratas, referrer, device.
 */

export type DailyCount = { label: string; count: number };
export type NamedCount = { label: string; count: number };

export type AnalyticsSummary = {
  totalViews: number;
  todayViews: number;
  uniqueSessions: number;
  daily: DailyCount[];
  topPages: NamedCount[];
  referrers: NamedCount[];
  devices: NamedCount[];
};

/** Tanggal WIB (YYYY-MM-DD) — konsisten dengan konvensi tanggal aplikasi. */
function jakartaDateKey(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export async function getAnalyticsSummary(days = 30): Promise<AnalyticsSummary> {
  const prisma = getPrisma();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalViews, todayViews, uniqueSessions, topPages, referrerGroups, deviceGroups] =
    await Promise.all([
      prisma.pageView.count({ where: { createdAt: { gte: since } } }),
      prisma.pageView.count({
        where: { createdAt: { gte: new Date(`${jakartaDateKey(new Date())}T00:00:00+07:00`) } },
      }),
      prisma.pageView.findMany({
        where: { createdAt: { gte: since } },
        select: { sessionId: true },
        distinct: ["sessionId"],
      }),
      prisma.pageView.groupBy({
        by: ["path"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { path: "desc" } },
        take: 10,
      }),
      prisma.pageView.groupBy({
        by: ["referrer"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { referrer: "desc" } },
        take: 10,
      }),
      prisma.pageView.groupBy({
        by: ["device"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { device: "desc" } },
      }),
    ]);

  // Bucket per hari (WIB) dihitung dari baris 30 hari terakhir — volume
  // toko bakery kecil, aman di-JS tanpa raw query.
  const rows = await prisma.pageView.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const byDay = new Map<string, number>();

  for (const row of rows) {
    const key = jakartaDateKey(row.createdAt);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }

  const daily: DailyCount[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const key = jakartaDateKey(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
    daily.push({ label: key, count: byDay.get(key) ?? 0 });
  }

  const deviceLabel: Record<string, string> = {
    mobile: "Mobile",
    tablet: "Tablet",
    desktop: "Desktop",
  };

  return {
    totalViews,
    todayViews,
    uniqueSessions: uniqueSessions.length,
    daily,
    topPages: topPages.map((row) => ({
      label: row.path,
      count: row._count._all,
    })),
    referrers: referrerGroups.map((row) => {
      let label = "Langsung / WA";

      if (row.referrer) {
        try {
          label = new URL(row.referrer).hostname || label;
        } catch {
          label = row.referrer.slice(0, 60);
        }
      }

      return { label, count: row._count._all };
    }),
    devices: deviceGroups.map((row) => ({
      label: deviceLabel[row.device] ?? row.device,
      count: row._count._all,
    })),
  };
}
