// 채팅방 페이지 (단계 5). 참여자 확인 + 진입 시 읽음 처리 후 메시지 렌더.
import { notFound, redirect } from "next/navigation";
import { query } from "@/lib/db";
import { CHAT_SQL } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import { SENDER } from "@/lib/constants";
import { ChatRoom } from "@/components/chat-room";
import type { ChatRoom as ChatRoomType, Message } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ roomNo: string }>;
}) {
  const user = await requireUser();
  const roomNo = Number((await params).roomNo);

  const rooms = await query<ChatRoomType>(CHAT_SQL.getRoom, { roomNo });
  const room = rooms[0];
  if (!room) notFound();

  // 참여자(판매자=cno 또는 구매자=receiveCno)만 입장 가능
  let myRole: "S" | "B";
  if (room.cno === user.cno) myRole = SENDER.SELLER;
  else if (room.receiveCno === user.cno) myRole = SENDER.BUYER;
  else redirect("/chat");

  // 진입 시 상대가 보낸 안 읽은 메시지를 읽음 처리
  const otherSender = myRole === SENDER.SELLER ? SENDER.BUYER : SENDER.SELLER;
  await query(CHAT_SQL.markRead, { roomNo, otherSender });

  const messages = await query<Message>(CHAT_SQL.listMessages, { roomNo });
  const partnerNickname =
    myRole === SENDER.SELLER ? room.buyerNickname! : room.sellerNickname!;

  return (
    <ChatRoom
      roomNo={roomNo}
      myRole={myRole}
      partnerNickname={partnerNickname}
      itemTitle={room.itemTitle ?? ""}
      itemCno={room.cno}
      itemNo={room.itemNo}
      initialMessages={messages}
    />
  );
}
