// 구매 요청 API (단계 4). 판매 중인 물품에 요청 금액 + 메시지를 보낸다.
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ITEM_SQL, PURCHASE_SQL } from "@/lib/queries";
import { getSessionCno } from "@/lib/session";
import { SELL_STATUS } from "@/lib/constants";
import type { Item } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cno: string; itemNo: string }> }
) {
  try {
    const requestCno = await getSessionCno();
    if (!requestCno) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { cno, itemNo: itemNoStr } = await params;
    const itemNo = Number(itemNoStr);
    const body = await req.json();

    // 물품 존재 확인
    const items = await query<Item>(ITEM_SQL.getById, { cno, itemNo });
    const item = items[0];
    if (!item) {
      return NextResponse.json({ error: "물품을 찾을 수 없습니다." }, { status: 404 });
    }

    // 예외: 본인 물품 요청 차단
    if (item.cno === requestCno) {
      return NextResponse.json(
        { error: "본인 물품에는 구매 요청할 수 없습니다." },
        { status: 400 }
      );
    }

    // 예외: 판매 중이 아닌 물품 차단 (거래 완료/예약 중)
    if (item.sellStatus !== SELL_STATUS.ON_SALE) {
      const msg =
        item.sellStatus === SELL_STATUS.DONE
          ? "이미 거래 완료된 물품에는 구매 요청할 수 없습니다."
          : "예약 중인 물품에는 구매 요청할 수 없습니다.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // 입력 검증 (금액 + 메시지 각각 저장)
    const price = Number(body?.reqPrice);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: "요청 금액을 0보다 큰 숫자로 입력해 주세요." },
        { status: 400 }
      );
    }
    const message = String(body?.reqMessage ?? "").trim();
    if (!message) {
      return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
    }
    if (message.length > 1000) {
      return NextResponse.json({ error: "메시지가 너무 깁니다." }, { status: 400 });
    }

    // 중복 요청 차단 (PK: requestCno+cno+itemNo)
    const exists = await query<{ cnt: number }>(PURCHASE_SQL.existsForRequester, {
      requestCno,
      cno,
      itemNo,
    });
    if (exists[0].cnt > 0) {
      return NextResponse.json(
        { error: "이미 이 물품에 구매 요청을 보냈습니다." },
        { status: 409 }
      );
    }

    await query(PURCHASE_SQL.insert, {
      requestCno,
      cno,
      itemNo,
      reqPrice: price,
      reqMessage: message,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/items/[cno]/[itemNo]/requests]", e);
    return NextResponse.json(
      { error: "구매 요청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
