// 채팅방 생성/조회 API (단계 5). 구매자가 물품에 대해 판매자와 1:1 방을 연다.
// (receiveCno=구매자, cno=판매자, itemNo) UNIQUE → 같은 조합이면 기존 방 재사용.
import { NextRequest, NextResponse } from "next/server";
import oracledb from "oracledb";
import { query, withTransaction } from "@/lib/db";
import { ITEM_SQL, CHAT_SQL } from "@/lib/queries";
import { getSessionCno } from "@/lib/session";
import type { Item } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const receiveCno = await getSessionCno();
    if (!receiveCno) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { cno, itemNo: itemNoRaw } = await req.json();
    const itemNo = Number(itemNoRaw);
    if (!cno || !Number.isFinite(itemNo)) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    // 물품 확인
    const items = await query<Item>(ITEM_SQL.getById, { cno, itemNo });
    const item = items[0];
    if (!item) {
      return NextResponse.json({ error: "물품을 찾을 수 없습니다." }, { status: 404 });
    }
    // 본인 물품과는 채팅방을 만들지 않는다.
    if (item.cno === receiveCno) {
      return NextResponse.json(
        { error: "본인 물품에는 채팅을 시작할 수 없습니다." },
        { status: 400 }
      );
    }

    // 기존 방이 있으면 재사용, 없으면 생성 (직렬화돼 있어 경합 없음)
    const roomNo = await withTransaction(async (conn) => {
      const found = await conn.execute<{ roomNo: number }>(CHAT_SQL.findRoom, {
        receiveCno,
        cno,
        itemNo,
      });
      if (found.rows && found.rows.length > 0) {
        return found.rows[0].roomNo;
      }
      const created = await conn.execute(CHAT_SQL.createRoom, {
        receiveCno,
        cno,
        itemNo,
        roomNo: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      });
      const out = created.outBinds as { roomNo: number[] };
      return out.roomNo[0];
    });

    return NextResponse.json({ roomNo });
  } catch (e) {
    console.error("[POST /api/chat/rooms]", e);
    return NextResponse.json(
      { error: "채팅방을 여는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
