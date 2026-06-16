// 거래 승인 → 예약 중 (단계 6).
// 한 트랜잭션으로: ① 물품을 '예약 중'으로(resDateTime=현재시각) ② 나머지 요청자 자동 삭제.
import { NextRequest, NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { PURCHASE_SQL } from "@/lib/queries";
import { getSessionCno } from "@/lib/session";
import { SELL_STATUS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const seller = await getSessionCno();
    if (!seller) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { cno, itemNo, requestCno } = await req.json();
    const itemNo_ = Number(itemNo);
    if (!cno || !requestCno || !Number.isFinite(itemNo_)) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }
    // 판매자(물품 소유자) 본인만 승인할 수 있다.
    if (seller !== cno) {
      return NextResponse.json(
        { error: "본인 물품의 요청만 승인할 수 있습니다." },
        { status: 403 }
      );
    }

    const result = await withTransaction(async (conn) => {
      // 승인 대상 요청이 실제로 존재하는지 확인
      const ex = await conn.execute<{ cnt: number }>(
        PURCHASE_SQL.existsForRequester,
        { requestCno, cno, itemNo: itemNo_ }
      );
      if ((ex.rows?.[0]?.cnt ?? 0) === 0) {
        return { ok: false, status: 404, error: "해당 구매 요청을 찾을 수 없습니다." };
      }

      // 판매 중일 때만 예약 중으로 전환 (rowsAffected=0 → 이미 예약/거래완료)
      const upd = await conn.execute(PURCHASE_SQL.approveReserve, {
        reserved: SELL_STATUS.RESERVED,
        onSale: SELL_STATUS.ON_SALE,
        cno,
        itemNo: itemNo_,
      });
      if ((upd.rowsAffected ?? 0) === 0) {
        return {
          ok: false,
          status: 409,
          error: "이미 예약되었거나 판매 중인 물품이 아닙니다.",
        };
      }

      // 승인된 요청자 외 나머지 요청 자동 삭제
      await conn.execute(PURCHASE_SQL.deleteOthers, {
        cno,
        itemNo: itemNo_,
        requestCno,
      });

      return { ok: true as const };
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/requests/approve]", e);
    return NextResponse.json(
      { error: "승인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
