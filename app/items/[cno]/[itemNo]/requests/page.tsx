// 받은 구매 요청 목록 (단계 4, 판매자 전용). 승인은 단계 6에서 추가된다.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon, InboxIcon } from "lucide-react";
import { query } from "@/lib/db";
import { ITEM_SQL, PURCHASE_SQL } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatPrice, formatDateTime } from "@/lib/format";
import type { Item, PurchaseReq } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReceivedRequestsPage({
  params,
}: {
  params: Promise<{ cno: string; itemNo: string }>;
}) {
  const user = await requireUser();
  const { cno, itemNo } = await params;
  const itemNoNum = Number(itemNo);

  const items = await query<Item>(ITEM_SQL.getById, { cno, itemNo: itemNoNum });
  const item = items[0];
  if (!item) notFound();

  // 판매자 본인만 받은 요청을 볼 수 있다.
  if (user.cno !== item.cno) redirect(`/items/${cno}/${itemNo}`);

  const requests = await query<PurchaseReq>(PURCHASE_SQL.listForItem, {
    cno,
    itemNo: itemNoNum,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href={`/items/${cno}/${itemNo}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" /> 물품으로 돌아가기
      </Link>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">받은 구매 요청</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{item.title}</p>
        </div>
        <StatusBadge status={item.sellStatus} />
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-muted-foreground">
          <InboxIcon className="size-8" />
          <span className="text-sm">아직 받은 구매 요청이 없습니다.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            총 <b className="text-foreground">{requests.length}</b>명이 요청했습니다.
          </p>
          {requests.map((r) => (
            <Card key={r.requestCno}>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {r.requesterNickname}{" "}
                    <span className="text-xs text-muted-foreground">({r.requestCno})</span>
                  </span>
                  <span className="font-bold">{formatPrice(r.reqPrice)}</span>
                </div>
                {r.reqMessage && (
                  <p className="whitespace-pre-wrap rounded-lg bg-muted/60 px-3 py-2 text-sm">
                    {r.reqMessage}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(r.reqDateTime)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
