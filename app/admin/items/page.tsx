// 물품/거래 관리 페이지 (C단계) — c0 전용.
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { ADMIN_SQL } from "@/lib/queries";
import { sweepExpiredReservations } from "@/lib/reservation";
import { AdminItems, type AdminItemRow } from "@/components/admin-items";

export const dynamic = "force-dynamic";

export default async function AdminItemsPage() {
  await requireAdmin();
  await sweepExpiredReservations();
  const items = await query<AdminItemRow>(ADMIN_SQL.items, {});

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">물품/거래 관리</h1>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">
        전체 물품·거래 목록과 강제 삭제 · 관리자 전용
      </p>
      <AdminItems items={items} />
    </div>
  );
}
