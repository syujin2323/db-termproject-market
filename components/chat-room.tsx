"use client";

// 채팅방 UI (단계 5). 말풍선(보낸사람/시간/읽음) + 입력 + 3초 폴링으로 상대 메시지 수신.
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeftIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format";
import type { Message } from "@/lib/types";

interface Props {
  roomNo: number;
  myRole: "S" | "B";
  partnerNickname: string;
  itemTitle: string;
  itemCno: string;
  itemNo: number;
  initialMessages: Message[];
}

export function ChatRoom({
  roomNo,
  myRole,
  partnerNickname,
  itemTitle,
  itemCno,
  itemNo,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 새 메시지가 생기면 맨 아래로 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3초마다 메시지 갱신(상대가 보낸 글 수신 + 읽음 처리)
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/${roomNo}/messages`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
        }
      } catch {
        /* 폴링 실패는 조용히 무시 */
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [roomNo]);

  async function refresh() {
    const res = await fetch(`/api/chat/${roomNo}/messages`, { cache: "no-store" });
    if (res.ok) setMessages((await res.json()).messages);
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${roomNo}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "메시지를 보내지 못했습니다.");
        return;
      }
      setText("");
      await refresh();
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-2xl flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Link
          href="/chat"
          className="text-muted-foreground hover:text-foreground"
          aria-label="목록으로"
        >
          <ArrowLeftIcon className="size-5" />
        </Link>
        <div className="min-w-0">
          <p className="font-semibold">{partnerNickname}</p>
          <Link
            href={`/items/${itemCno}/${itemNo}`}
            className="line-clamp-1 text-xs text-muted-foreground hover:underline"
          >
            {itemTitle}
          </Link>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            첫 메시지를 보내보세요.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender === myRole;
          return (
            <div
              key={m.seqNo}
              className={cn("flex items-end gap-1.5", mine ? "justify-end" : "justify-start")}
            >
              {/* 내 메시지: 시간/읽음을 왼쪽에 */}
              {mine && (
                <span className="mb-0.5 text-[10px] text-muted-foreground">
                  {m.isRead === "Y" && <span className="text-primary">읽음 </span>}
                  {formatTime(m.sentDateTime)}
                </span>
              )}
              <div
                className={cn(
                  "max-w-[75%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                  mine
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-muted"
                )}
              >
                {m.content}
              </div>
              {!mine && (
                <span className="mb-0.5 text-[10px] text-muted-foreground">
                  {formatTime(m.sentDateTime)}
                </span>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력 */}
      <form onSubmit={send} className="flex items-center gap-2 border-t px-4 py-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요"
          autoComplete="off"
        />
        <Button type="submit" size="icon" disabled={sending || !text.trim()}>
          <SendIcon />
        </Button>
      </form>
    </div>
  );
}
