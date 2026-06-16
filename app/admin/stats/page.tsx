// 관리자 통계 (단계 9) — 관리자(c0) 전용.
// 그룹 함수(GROUP BY ROLLUP) + 윈도우 함수(RANK() OVER) 통계.
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { STATS_SQL } from "@/lib/queries";
import { SELL_STATUS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface CategoryRow {
  category: string;
  dealCount: number;
  totalAmount: number;
  avgAmount: number;
  isTotal: number;
}
interface SellerRow {
  cno: string;
  nickname: string;
  dealCount: number;
  totalAmount: number;
  rank: number;
}

function medal(rank: number): string {
  return rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}위`;
}

export default async function AdminStatsPage() {
  await requireAdmin();

  const categories = await query<CategoryRow>(STATS_SQL.categoryRollup, {
    done: SELL_STATUS.DONE,
  });
  const sellers = await query<SellerRow>(STATS_SQL.sellerRanking, {
    done: SELL_STATUS.DONE,
  });

  const total = categories.find((c) => c.isTotal === 1);
  const maxAmount = Math.max(
    1,
    ...categories.filter((c) => c.isTotal !== 1).map((c) => c.totalAmount)
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">거래 통계</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        거래 완료된 물품 기준 · 관리자 전용
      </p>

      {/* 요약 */}
      {total && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SummaryCard label="총 거래 건수" value={`${total.dealCount}건`} />
          <SummaryCard label="총 거래액" value={formatPrice(total.totalAmount)} />
          <SummaryCard label="평균 거래액" value={formatPrice(total.avgAmount)} />
        </div>
      )}

      {/* 카테고리별 (GROUP BY ROLLUP) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>카테고리별 거래 통계</CardTitle>
          <CardDescription>그룹 함수 · GROUP BY ROLLUP(category)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 font-medium">카테고리</th>
                  <th className="py-2 text-right font-medium">건수</th>
                  <th className="py-2 text-right font-medium">거래총액</th>
                  <th className="py-2 text-right font-medium">평균</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => {
                  const isTotal = c.isTotal === 1;
                  return (
                    <tr
                      key={c.category}
                      className={
                        isTotal
                          ? "border-t-2 border-foreground/20 font-semibold"
                          : "border-b border-border/60"
                      }
                    >
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <span>{c.category}</span>
                          {!isTotal && (
                            <span
                              className="hidden h-1.5 rounded-full bg-primary/70 sm:inline-block"
                              style={{
                                width: `${Math.max(8, (c.totalAmount / maxAmount) * 80)}px`,
                              }}
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-2 text-right tabular-nums">{c.dealCount}</td>
                      <td className="py-2 text-right tabular-nums">
                        {formatPrice(c.totalAmount)}
                      </td>
                      <td className="py-2 text-right tabular-nums text-muted-foreground">
                        {formatPrice(c.avgAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 판매자별 순위 (윈도우 함수) */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>판매자별 거래액 순위</CardTitle>
          <CardDescription>윈도우 함수 · RANK() OVER (ORDER BY 거래총액 DESC)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 font-medium">순위</th>
                  <th className="py-2 font-medium">판매자</th>
                  <th className="py-2 text-right font-medium">거래건수</th>
                  <th className="py-2 text-right font-medium">거래총액</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((s) => (
                  <tr key={s.cno} className="border-b border-border/60">
                    <td className="py-2">{medal(s.rank)}</td>
                    <td className="py-2">
                      {s.nickname}{" "}
                      <span className="text-xs text-muted-foreground">({s.cno})</span>
                    </td>
                    <td className="py-2 text-right tabular-nums">{s.dealCount}</td>
                    <td className="py-2 text-right font-medium tabular-nums">
                      {formatPrice(s.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
