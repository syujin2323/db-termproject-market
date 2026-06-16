// 내 채팅방 목록 (단계 5). 판매자/구매자 양쪽 방을 모두 보여주고, 방별 안읽음 배지.
import Link from "next/link";
import { MessageCircleIcon } from "lucide-react";
import { query } from "@/lib/db";
import { CHAT_SQL } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import type { ChatRoom } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ChatListPage() {
  const user = await requireUser();
  const rooms = await query<ChatRoom>(CHAT_SQL.listRooms, { me: user.cno });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">채팅</h1>

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-muted-foreground">
          <MessageCircleIcon className="size-8" />
          <span className="text-sm">참여 중인 채팅방이 없습니다.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rooms.map((room) => {
            const iAmSeller = room.cno === user.cno;
            const partner = iAmSeller ? room.buyerNickname : room.sellerNickname;
            const partnerRole = iAmSeller ? "구매자" : "판매자";
            const unread = room.unreadCount ?? 0;
            return (
              <Link key={room.roomNo} href={`/chat/${room.roomNo}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MessageCircleIcon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{partner}</span>
                        <span className="text-xs text-muted-foreground">
                          {partnerRole}
                        </span>
                        <StatusBadge
                          status={room.sellStatus ?? ""}
                          className="ml-auto shrink-0"
                        />
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                        {room.itemTitle}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">
                        {room.lastTime ? formatDateTime(room.lastTime) : ""}
                      </span>
                      {unread > 0 && (
                        <Badge className="bg-primary text-primary-foreground">
                          {unread}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
