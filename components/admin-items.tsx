"use client";

// 물품/거래 관리 (C단계, Page_adminItem) — 카테고리·상태 필터 + 강제 삭제.
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { CATEGORIES, SELL_STATUS } from "@/lib/constants";

export interface AdminItemRow {
  cno: string;
  itemNo: number;
  title: string;
  category: string;
  price: number;
  sellStatus: string;
  finalPrice: number | null;
  sellerNickname: string;
  sellerRegion: string | null;
}

const selectCls =
  "h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function AdminItems({ items }: { items: AdminItemRow[] }) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");
  const [target, setTarget] = useState<AdminItemRow | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = list.filter(
    (it) => (!cat || it.category === cat) && (!status || it.sellStatus === status)
  );

  async function confirmDelete() {
    if (!target) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/items/${target.cno}/${target.itemNo}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "삭제에 실패했습니다.");
        return;
      }
      setList((prev) =>
        prev.filter((x) => !(x.cno === target.cno && x.itemNo === target.itemNo))
      );
      toast.success("물품을 삭제했습니다.");
      setTarget(null);
      router.refresh();
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* 필터 */}
      <div className="mb-4 flex flex-wrap gap-2">
        <select className={selectCls} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">전체 카테고리</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">전체 상태</option>
          {Object.values(SELL_STATUS).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="ml-auto self-center text-sm text-muted-foreground">
          총 <b className="text-foreground">{filtered.length}</b>건
        </span>
      </div>

      <Card>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 font-medium">물품</th>
                <th className="py-2 font-medium">판매자</th>
                <th className="py-2 font-medium">상태</th>
                <th className="py-2 text-right font-medium">가격</th>
                <th className="py-2 text-right font-medium">최종가</th>
                <th className="py-2 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-foreground">
                    해당하는 물품이 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((it) => (
                  <tr key={`${it.cno}-${it.itemNo}`} className="border-b border-border/60">
                    <td className="py-2">
                      <Link
                        href={`/items/${it.cno}/${it.itemNo}`}
                        className="font-medium hover:underline"
                      >
                        {it.title}
                      </Link>
                      <span className="ml-1 font-mono text-xs text-muted-foreground">
                        ({it.cno}/{it.itemNo})
                      </span>
                      <div className="text-xs text-muted-foreground">{it.category}</div>
                    </td>
                    <td className="py-2">
                      {it.sellerNickname}
                      {it.sellerRegion && (
                        <div className="text-xs text-muted-foreground">{it.sellerRegion}</div>
                      )}
                    </td>
                    <td className="py-2">
                      <StatusBadge status={it.sellStatus} />
                    </td>
                    <td className="py-2 text-right tabular-nums">{formatPrice(it.price)}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {it.finalPrice != null ? formatPrice(it.finalPrice) : "-"}
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setTarget(it)}
                        aria-label="삭제"
                        className="text-destructive"
                      >
                        <Trash2Icon />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>물품 강제 삭제</DialogTitle>
            <DialogDescription>
              <b className="text-foreground">{target?.title}</b> ({target?.cno}/
              {target?.itemNo})을(를) 삭제합니다. 이 물품의 구매 요청·채팅방·메시지도 함께
              삭제되며 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={loading}>
              취소
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={loading}
              className={cn("bg-destructive text-white hover:bg-destructive/90")}
            >
              {loading ? "삭제 중…" : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
