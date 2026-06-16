// 관리자 통계 화면. 단계 1에서는 접근 권한(관리자 c0 전용)만 적용한 자리표시.
// 실제 GROUP BY / 윈도우 함수 통계는 단계 9에서 구현한다.
import { requireAdmin } from "@/lib/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default async function AdminStatsPage() {
  // 관리자가 아니면 홈으로 리다이렉트된다.
  await requireAdmin();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">거래 통계</h1>
      <p className="mt-1 text-muted-foreground">관리자 전용 화면입니다.</p>

      <Card className="mt-6 bg-muted/40">
        <CardHeader>
          <CardTitle>준비 중</CardTitle>
          <CardDescription>
            카테고리별 거래 통계(GROUP BY ROLLUP)와 회원별 거래액 순위(윈도우 함수)는
            단계 9에서 이 화면에 구현됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          지금은 관리자 권한 분리만 확인할 수 있습니다. (비관리자는 이 페이지에 접근하면
          홈으로 이동합니다.)
        </CardContent>
      </Card>
    </div>
  );
}
