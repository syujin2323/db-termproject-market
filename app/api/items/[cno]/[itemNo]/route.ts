// 물품 PATCH — 거래 완료 처리 (단계 7).
// 예약 중인 물품을 '거래 완료'로 바꾸고 최종 금액(finalPrice)을 저장한다.
import { NextRequest, NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { ITEM_SQL, PURCHASE_SQL } from "@/lib/queries";
import { getSessionCno } from "@/lib/session";
import { SELL_STATUS } from "@/lib/constants";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cno: string; itemNo: string }> }
) {
  try {
    const seller = await getSessionCno();
    if (!seller) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { cno, itemNo } = await params;
    const itemNo_ = Number(itemNo);
    // 판매자(물품 소유자) 본인만 거래 완료 처리할 수 있다.
    if (seller !== cno) {
      return NextResponse.json(
        { error: "본인 물품만 거래 완료할 수 있습니다." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const finalPrice = Number(String(body?.finalPrice ?? "").replace(/[^0-9]/g, ""));
    if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
      return NextResponse.json(
        { error: "최종 거래 금액을 0보다 큰 숫자로 입력해 주세요." },
        { status: 400 }
      );
    }

    const result = await withTransaction(async (conn) => {
      // 예약 중일 때만 거래 완료로 전환 (rowsAffected=0 → 예약 중이 아님)
      const upd = await conn.execute(ITEM_SQL.complete, {
        done: SELL_STATUS.DONE,
        reserved: SELL_STATUS.RESERVED,
        finalPrice,
        cno,
        itemNo: itemNo_,
      });
      if ((upd.rowsAffected ?? 0) === 0) {
        return { ok: false, status: 409, error: "예약 중인 거래만 완료할 수 있습니다." };
      }
      // 거래가 끝났으므로 남아 있던 구매 요청을 정리한다.
      await conn.execute(PURCHASE_SQL.deleteForItem, { cno, itemNo: itemNo_ });
      return { ok: true as const };
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/items/[cno]/[itemNo]]", e);
    return NextResponse.json(
      { error: "거래 완료 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
