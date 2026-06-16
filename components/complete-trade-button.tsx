"use client";

// 거래 완료 버튼 (단계 7). 최종 거래 금액을 입력해 '거래 완료'로 전환한다.
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function CompleteTradeButton({
  cno,
  itemNo,
  defaultPrice,
}: {
  cno: string;
  itemNo: number;
  defaultPrice: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(String(defaultPrice ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function complete(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const finalPrice = Number(price.replace(/[^0-9]/g, ""));
    if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
      setError("최종 거래 금액을 0보다 큰 숫자로 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/items/${cno}/${itemNo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalPrice }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "거래 완료 처리에 실패했습니다.");
        return;
      }
      toast.success("거래가 완료되었습니다.");
      setOpen(false);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <CircleCheckIcon /> 거래 완료
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>거래 완료</DialogTitle>
            <DialogDescription>
              실제 거래된 최종 금액을 입력하면 물품이 &lsquo;거래 완료&rsquo;로 바뀝니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={complete} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="finalPrice">최종 거래 금액 (원)</Label>
              <Input
                id="finalPrice"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="예: 980000"
                autoFocus
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
                {loading ? "처리 중…" : "거래 완료 처리"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
