// 관리자 홈 (C단계, Page_adminHome) — 운영 현황 요약 + 바로가기. c0 전용.
import Link from "next/link";
import {
  UsersIcon,
  PackageIcon,
  ChartColumnBigIcon,
  CircleCheckIcon,
  ClockIcon,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { ADMIN_SQL } from "@/lib/queries";
import { ADMIN_CNO, SELL_STATUS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface Summary {
  memberCount: number;
  itemCount: number;
  doneCount: number;
  reservedCount: number;
}

export default async function AdminHomePage() {
  await requireAdmin();
  const rows = await query<Summary>(ADMIN_SQL.summary, {
    admin: ADMIN_CNO,
    done: SELL_STATUS.DONE,
    reserved: SELL_STATUS.RESERVED,
  });
  const s = rows[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">관리자 콘솔</h1>
      <p className="mt-1 text-sm text-muted-foreground">운영 현황 요약 · c0 전용</p>

      {/* 요약 지표 */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric icon={<UsersIcon className="size-5" />} label="회원" value={s?.memberCount ?? 0} />
        <Metric icon={<PackageIcon className="size-5" />} label="등록 물품" value={s?.itemCount ?? 0} />
        <Metric icon={<CircleCheckIcon className="size-5" />} label="거래 완료" value={s?.doneCount ?? 0} />
        <Metric icon={<ClockIcon className="size-5" />} label="진행 중 예약" value={s?.reservedCount ?? 0} />
      </div>

      {/* 바로가기 */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <NavCard
          href="/admin/members"
          title="회원 관리"
          desc="회원 목록·검색"
          icon={<UsersIcon className="size-5" />}
        />
        <NavCard
          href="/admin/items"
          title="물품/거래 관리"
          desc="전체 물품·강제 삭제"
          icon={<PackageIcon className="size-5" />}
        />
        <NavCard
          href="/admin/stats"
          title="거래 통계"
          desc="ROLLUP · 윈도우 함수"
          icon={<ChartColumnBigIcon className="size-5" />}
        />
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function NavCard({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="py-4">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </span>
          <p className="mt-2 font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
