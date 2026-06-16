"use client";

// 구매 요청 승인 버튼 (단계 6). 승인 시 예약 중 전환 + 나머지 요청 삭제됨을 확인받는다.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function ApproveButton({
  cno,
  itemNo,
  requestCno,
  requesterNickname,
}: {
  cno: string;
  itemNo: number;
  requestCno: string;
  requesterNickname: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function approve() {
    setLoading(true);
    try {
      const res = await fetch("/api/requests/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cno, itemNo, requestCno }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "승인에 실패했습니다.");
        return;
      }
      toast.success(`${requesterNickname}님의 요청을 승인했습니다.`);
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <CheckIcon /> 승인
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>구매 요청 승인</DialogTitle>
            <DialogDescription>
              <b className="text-foreground">{requesterNickname}</b>님의 요청을
              승인하면 물품이 &lsquo;예약 중&rsquo;으로 바뀌고, 나머지 요청은 모두
              자동으로 삭제됩니다. 계속할까요?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              취소
            </Button>
            <Button onClick={approve} disabled={loading}>
              {loading ? "승인 중…" : "승인하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
