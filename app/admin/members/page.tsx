// 회원 관리 페이지 (C단계) — c0 전용.
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { ADMIN_SQL } from "@/lib/queries";
import { ADMIN_CNO } from "@/lib/constants";
import { AdminMembers, type MemberRow } from "@/components/admin-members";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  await requireAdmin();
  const members = await query<MemberRow>(ADMIN_SQL.members, { admin: ADMIN_CNO });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">회원 관리</h1>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">
        전체 회원 목록과 등록 물품 수 · 관리자 전용
      </p>
      <AdminMembers members={members} />
    </div>
  );
}
