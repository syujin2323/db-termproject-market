// 물품 상세 (단계 2: 정보 + 사진 표시). 구매 요청/채팅은 단계 4에서 추가된다.
import { notFound } from "next/navigation";
import { ImageOffIcon, MapPinIcon } from "lucide-react";
import { query } from "@/lib/db";
import { ITEM_SQL, PURCHASE_SQL } from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { StatusBadge } from "@/components/status-badge";
import { ItemActions } from "@/components/item-actions";
import { Separator } from "@/components/ui/separator";
import { formatPrice, formatDateTime } from "@/lib/format";
import { SELL_STATUS } from "@/lib/constants";
import type { Item } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ cno: string; itemNo: string }>;
}) {
  const { cno, itemNo } = await params;
  const itemNoNum = Number(itemNo);
  const rows = await query<Item>(ITEM_SQL.getById, { cno, itemNo: itemNoNum });
  const item = rows[0];
  if (!item) notFound();

  // 현재 사용자 / 소유 여부 / (판매자면) 받은 요청 수
  const user = await getCurrentUser();
  const isOwner = user?.cno === item.cno;
  let reqCount = 0;
  if (isOwner) {
    const c = await query<{ cnt: number }>(PURCHASE_SQL.countForItem, {
      cno,
      itemNo: itemNoNum,
    });
    reqCount = c[0]?.cnt ?? 0;
  }

  const photoCount = item.photoCount ?? 0;
  const photoIndexes = Array.from({ length: photoCount }, (_, i) => i + 1);
  const isDone = item.sellStatus === SELL_STATUS.DONE;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* 사진 */}
      {photoCount > 0 ? (
        <div className="flex flex-col gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/items/${cno}/${itemNo}/photo/1`}
            alt={item.title}
            className="aspect-[4/3] w-full rounded-2xl border object-cover"
          />
          {photoCount > 1 && (
            <div className="flex gap-2">
              {photoIndexes.slice(1).map((n) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={n}
                  src={`/api/items/${cno}/${itemNo}/photo/${n}`}
                  alt={`${item.title} ${n}`}
                  className="size-20 rounded-xl border object-cover"
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-muted/40 text-muted-foreground">
          <ImageOffIcon className="size-8" />
          <span className="text-sm">등록된 사진이 없습니다</span>
        </div>
      )}

      {/* 정보 */}
      <div className="mt-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight">{item.title}</h1>
          <StatusBadge status={item.sellStatus} className="mt-1 shrink-0" />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{item.category}</p>

        <p className="mt-3 text-2xl font-bold">
          {formatPrice(item.price)}
        </p>
        {isDone && item.finalPrice != null && (
          <p className="mt-1 text-sm text-muted-foreground">
            최종 거래가 <b className="text-foreground">{formatPrice(item.finalPrice)}</b>
          </p>
        )}

        <Separator className="my-4" />

        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {item.description || "설명이 없습니다."}
        </p>

        <dl className="mt-5 grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPinIcon className="size-4" />
            <span>{item.tradePlace || "거래 장소 미지정"}</span>
          </div>
          <div className="text-muted-foreground">
            판매자 <b className="text-foreground">{item.sellerNickname}</b> ({item.cno})
            · 등록일 {formatDateTime(item.regDateTime)}
          </div>
        </dl>

        <div className="mt-6">
          <ItemActions
            cno={item.cno}
            itemNo={item.itemNo}
            price={item.price}
            sellStatus={item.sellStatus}
            currentCno={user?.cno ?? null}
            isOwner={isOwner}
            reqCount={reqCount}
          />
        </div>
      </div>
    </div>
  );
}
