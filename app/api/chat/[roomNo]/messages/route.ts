// 채팅 메시지 API (단계 5). GET=읽음 처리 후 목록, POST=전송.
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { CHAT_SQL } from "@/lib/queries";
import { getSessionCno } from "@/lib/session";
import { SENDER } from "@/lib/constants";
import type { ChatRoom, Message } from "@/lib/types";

/** 방에서 나의 역할('S'=판매자, 'B'=구매자)을 구한다. 참여자가 아니면 null. */
async function resolveRole(
  roomNo: number,
  cno: string
): Promise<{ room: ChatRoom; myRole: "S" | "B" } | null> {
  const rooms = await query<ChatRoom>(CHAT_SQL.getRoom, { roomNo });
  const room = rooms[0];
  if (!room) return null;
  if (room.cno === cno) return { room, myRole: SENDER.SELLER };
  if (room.receiveCno === cno) return { room, myRole: SENDER.BUYER };
  return null; // 참여자 아님
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomNo: string }> }
) {
  try {
    const cno = await getSessionCno();
    if (!cno) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const roomNo = Number((await params).roomNo);
    const resolved = await resolveRole(roomNo, cno);
    if (!resolved) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    // 내가 방을 보고 있으므로 상대가 보낸 안 읽은 메시지를 읽음 처리
    const otherSender = resolved.myRole === SENDER.SELLER ? SENDER.BUYER : SENDER.SELLER;
    await query(CHAT_SQL.markRead, { roomNo, otherSender });

    const messages = await query<Message>(CHAT_SQL.listMessages, { roomNo });
    return NextResponse.json({ messages, myRole: resolved.myRole });
  } catch (e) {
    console.error("[GET /api/chat/[roomNo]/messages]", e);
    return NextResponse.json({ error: "메시지를 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomNo: string }> }
) {
  try {
    const cno = await getSessionCno();
    if (!cno) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const roomNo = Number((await params).roomNo);
    const resolved = await resolveRole(roomNo, cno);
    if (!resolved) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    const content = String((await req.json())?.content ?? "").trim();
    if (!content) {
      return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: "메시지가 너무 깁니다." }, { status: 400 });
    }

    await query(CHAT_SQL.insertMessage, {
      roomNo,
      sender: resolved.myRole,
      content,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/chat/[roomNo]/messages]", e);
    return NextResponse.json({ error: "메시지 전송에 실패했습니다." }, { status: 500 });
  }
}
