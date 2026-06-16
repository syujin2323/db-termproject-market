// 홈 = 물품 목록 + 검색 (단계 3). 로그인 없이도 둘러볼 수 있다.
// (구매 요청/채팅 등 행동은 상세 화면에서 로그인 여부로 구분된다.)
import { query } from "@/lib/db";
import { ITEM_SQL } from "@/lib/queries";
import { sweepExpiredReservations } from "@/lib/reservation";
import { ItemBrowser } from "@/components/item-browser";
import type { Item } from "@/lib/types";

// 등록/거래로 목록이 계속 바뀌므로 항상 최신 데이터를 조회한다.
export const dynamic = "force-dynamic";

export default async function Home() {
  // 화면 진입 시 48시간 초과 예약 자동취소 (단계 8)
  await sweepExpiredReservations();
  // 초기 목록(최신순) — 이후 검색은 클라이언트에서 /api/items 로 갱신한다.
  const items = await query<Item>(
    `${ITEM_SQL.listSelect} ORDER BY i.regDateTime DESC`
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">중고 물품</h1>
      <ItemBrowser initialItems={items} />
    </div>
  );
}
