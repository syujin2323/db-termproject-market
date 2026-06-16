"use client";

// 물품 상세의 행동 영역.
// - 판매자(본인): 받은 구매 요청 목록으로 이동
// - 구매자(타인, 로그인): 구매 요청 다이얼로그(금액+메시지) + 채팅하기
// - 비로그인: 로그인 유도 / 판매중 아님: 구매요청 비활성
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HandCoinsIcon, InboxIcon, MessageCircleIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { SELL_STATUS } from "@/lib/constants";

interface Props {
  cno: string;
  itemNo: number;
  price: number;
  sellStatus: string;
  currentCno: string | null;
  isOwner: boolean;
  reqCount: number;
}

export function ItemActions({
  cno,
  itemNo,
  price,
  sellStatus,
  currentCno,
  isOwner,
  reqCount,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reqPrice, setReqPrice] = useState(String(price));
  const [reqMessage, setReqMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const onSale = sellStatus === SELL_STATUS.ON_SALE;

  // 판매자(본인) → 받은 요청 목록
  if (isOwner) {
    return (
      <Link
        href={`/items/${cno}/${itemNo}/requests`}
        className={cn(buttonVariants({ size: "lg" }), "w-full")}
      >
        <InboxIcon /> 받은 구매 요청 {reqCount}건 보기
      </Link>
    );
  }

  // 채팅 시작(또는 기존 방으로 이동)
  async function startChat() {
    if (!currentCno) {
      router.push("/login");
      return;
    }
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cno, itemNo }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "채팅방을 열 수 없습니다.");
        return;
      }
      router.push(`/chat/${data.roomNo}`);
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setChatLoading(false);
    }
  }

  async function submitRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const priceNum = Number(reqPrice.replace(/[^0-9]/g, ""));
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError("요청 금액을 0보다 큰 숫자로 입력해 주세요.");
      return;
    }
    if (!reqMessage.trim()) {
      setError("메시지를 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/items/${cno}/${itemNo}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reqPrice: priceNum, reqMessage: reqMessage.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "구매 요청에 실패했습니다.");
        return;
      }
      toast.success("구매 요청을 보냈습니다.");
      setOpen(false);
      setReqMessage("");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        {/* 구매 요청 */}
        {onSale ? (
          <Button
            size="lg"
            className="flex-1"
            onClick={() => (currentCno ? setOpen(true) : router.push("/login"))}
          >
            <HandCoinsIcon /> 구매 요청
          </Button>
        ) : (
          <Button size="lg" className="flex-1" disabled>
            {sellStatus === SELL_STATUS.DONE ? "거래 완료됨" : "예약 중"}
          </Button>
        )}

        {/* 채팅 */}
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          onClick={startChat}
          disabled={chatLoading}
        >
          <MessageCircleIcon /> 채팅하기
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>구매 요청</DialogTitle>
            <DialogDescription>
              희망 금액과 메시지를 적어 판매자에게 보냅니다. (정가 {formatPrice(price)})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitRequest} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reqPrice">희망 금액 (원)</Label>
              <Input
                id="reqPrice"
                inputMode="numeric"
                value={reqPrice}
                onChange={(e) => setReqPrice(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="예: 1000000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reqMessage">메시지</Label>
              <Textarea
                id="reqMessage"
                value={reqMessage}
                onChange={(e) => setReqMessage(e.target.value)}
                placeholder="예: 직거래 가능할까요? 강남역에서 뵐 수 있습니다."
                rows={4}
                maxLength={1000}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                취소
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "보내는 중…" : "요청 보내기"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
