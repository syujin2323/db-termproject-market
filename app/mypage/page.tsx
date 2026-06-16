// 마이페이지 (B단계) — 내 판매물품 / 받은 요청 / 보낸 요청 / 내 정보.
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { MYPAGE_SQL } from "@/lib/queries";
import { sweepExpiredReservations } from "@/lib/reservation";
import {
  MyPageTabs,
  type SaleItem,
  type ReceivedReq,
  type SentReq,
} from "@/components/mypage-tabs";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const user = await requireUser();
  // 화면 진입 시 48시간 초과 예약 자동취소 (단계 8)
  await sweepExpiredReservations();

  const sales = await query<SaleItem>(MYPAGE_SQL.mySales, { me: user.cno });
  const received = await query<ReceivedReq>(MYPAGE_SQL.receivedRequests, { me: user.cno });
  const sent = await query<SentReq>(MYPAGE_SQL.sentRequests, { me: user.cno });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">마이페이지</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {user.nickname}님의 거래 내역을 관리하세요.
      </p>
      <MyPageTabs user={user} sales={sales} received={received} sent={sent} />
    </div>
  );
}
