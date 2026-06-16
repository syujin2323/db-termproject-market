// 관리자 물품 강제 삭제 API (C단계). c0 전용.
// FK 때문에 message → chatroom → purchasereq → item 순으로 한 트랜잭션에서 삭제.
import { NextRequest, NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { ADMIN_SQL } from "@/lib/queries";
import { getSessionCno } from "@/lib/session";
import { ADMIN_CNO } from "@/lib/constants";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ cno: string; itemNo: string }> }
) {
  try {
    const session = await getSessionCno();
    if (session !== ADMIN_CNO) {
      return NextResponse.json({ error: "관리자만 사용할 수 있습니다." }, { status: 403 });
    }

    const { cno, itemNo } = await params;
    const itemNo_ = Number(itemNo);

    await withTransaction(async (conn) => {
      await conn.execute(ADMIN_SQL.deleteMessagesOfItem, { cno, itemNo: itemNo_ });
      await conn.execute(ADMIN_SQL.deleteChatroomsOfItem, { cno, itemNo: itemNo_ });
      await conn.execute(ADMIN_SQL.deleteRequestsOfItem, { cno, itemNo: itemNo_ });
      await conn.execute(ADMIN_SQL.deleteItem, { cno, itemNo: itemNo_ });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/admin/items]", e);
    return NextResponse.json(
      { error: "물품 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
