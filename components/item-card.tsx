// 목록용 물품 카드. 썸네일 + 제목 + 가격 + 상태배지 + 카테고리/지역.
import Link from "next/link";
import { ImageOffIcon } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatPrice } from "@/lib/format";
import type { Item } from "@/lib/types";

export function ItemCard({ item }: { item: Item }) {
  const hasPhoto = (item.photoCount ?? 0) > 0;
  return (
    <Link
      href={`/items/${item.cno}/${item.itemNo}`}
      className="group block overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square bg-muted">
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/items/${item.cno}/${item.itemNo}/photo/1`}
            alt={item.title}
            className="size-full object-cover transition-transform group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOffIcon className="size-8" />
          </div>
        )}
        <StatusBadge status={item.sellStatus} className="absolute left-2 top-2" />
      </div>
      <div className="p-3">
        <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
        <p className="mt-0.5 font-bold">{formatPrice(item.price)}</p>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
          {item.category}
          {item.sellerRegion ? ` · ${item.sellerRegion}` : ""}
        </p>
      </div>
    </Link>
  );
}
