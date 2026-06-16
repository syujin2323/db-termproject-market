// 받은 구매 요청 목록 (단계 4) + 승인 (단계 6), 판매자 전용.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon, InboxIcon } from "lucide-react";
import { query } from "@/lib/db";
import { ITEM_SQL, PURCHASE_SQL } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { ApproveButton } from "@/components/approve-button";
import { CompleteTradeButton } from "@/components/complete-trade-button";
import { formatPrice, formatDateTime } from "@/lib/format";
import { SELL_STATUS } from "@/lib/constants";
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

  const onSale = item.sellStatus === SELL_STATUS.ON_SALE;
  const reserved = item.sellStatus === SELL_STATUS.RESERVED;

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

      {/* 예약 중: 거래 완료 처리 패널 */}
      {reserved && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-amber-800">
              예약된 거래입니다. 거래가 끝나면 최종 금액을 입력해 완료하세요.
            </p>
            <CompleteTradeButton
              cno={cno}
              itemNo={itemNoNum}
              defaultPrice={requests[0]?.reqPrice ?? item.price}
            />
          </CardContent>
        </Card>
      )}

      {/* 거래 완료됨 */}
      {item.sellStatus === SELL_STATUS.DONE && (
        <Card className="mb-4 bg-muted/40">
          <CardContent className="text-sm text-muted-foreground">
            거래가 완료된 물품입니다. 최종 거래가{" "}
            <b className="text-foreground">{formatPrice(item.finalPrice)}</b>
          </CardContent>
        </Card>
      )}

      {requests.length === 0 ? (
        item.sellStatus === SELL_STATUS.DONE ? null : (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-muted-foreground">
            <InboxIcon className="size-8" />
            <span className="text-sm">아직 받은 구매 요청이 없습니다.</span>
          </div>
        )
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
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(r.reqDateTime)}
                  </p>
                  {onSale ? (
                    <ApproveButton
                      cno={cno}
                      itemNo={itemNoNum}
                      requestCno={r.requestCno}
                      requesterNickname={r.requesterNickname ?? r.requestCno}
                    />
                  ) : reserved ? (
                    <span className="text-xs font-medium text-amber-700">
                      예약된 요청
                    </span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
