"use client";

// 마이페이지 탭 UI (B단계). 내 판매물품 / 받은 요청 / 보낸 요청 / 내 정보.
import { useState } from "react";
import Link from "next/link";
import {
  PackageIcon,
  InboxIcon,
  SendIcon,
  UserIcon,
  ImageOffIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { formatPrice, formatDateTime } from "@/lib/format";
import { SELL_STATUS } from "@/lib/constants";
import type { Customer } from "@/lib/types";

export interface SaleItem {
  cno: string;
  itemNo: number;
  title: string;
  category: string;
  price: number;
  sellStatus: string;
  regDateTime: Date;
  finalPrice: number | null;
  photoCount: number;
  reqCount: number;
}
export interface ReceivedReq {
  requestCno: string;
  requesterNickname: string;
  cno: string;
  itemNo: number;
  itemTitle: string;
  sellStatus: string;
  reqPrice: number | null;
  reqMessage: string | null;
  reqDateTime: Date;
}
export interface SentReq {
  cno: string;
  itemNo: number;
  itemTitle: string;
  sellStatus: string;
  itemPrice: number;
  reqPrice: number | null;
  reqMessage: string | null;
  reqDateTime: Date;
  sellerNickname: string;
}

type TabKey = "sales" | "received" | "sent" | "profile";
const STATUS_FILTERS = ["전체", SELL_STATUS.ON_SALE, SELL_STATUS.RESERVED, SELL_STATUS.DONE] as const;

/** 보낸 요청의 상태 라벨 (대상 물품 상태로 판별) */
function sentStatus(sellStatus: string): { label: string; cls: string } {
  if (sellStatus === SELL_STATUS.RESERVED)
    return { label: "승인됨 (예약 중)", cls: "bg-emerald-100 text-emerald-700" };
  if (sellStatus === SELL_STATUS.DONE)
    return { label: "거래 완료", cls: "bg-zinc-200 text-zinc-600" };
  return { label: "대기 중", cls: "bg-sky-100 text-sky-700" };
}

export function MyPageTabs({
  user,
  sales,
  received,
  sent,
}: {
  user: Customer;
  sales: SaleItem[];
  received: ReceivedReq[];
  sent: SentReq[];
}) {
  const [tab, setTab] = useState<TabKey>("sales");
  const [statusFilter, setStatusFilter] = useState<string>("전체");

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "sales", label: "판매 물품", icon: <PackageIcon className="size-4" />, count: sales.length },
    { key: "received", label: "받은 요청", icon: <InboxIcon className="size-4" />, count: received.length },
    { key: "sent", label: "보낸 요청", icon: <SendIcon className="size-4" />, count: sent.length },
    { key: "profile", label: "내 정보", icon: <UserIcon className="size-4" /> },
  ];

  const filteredSales =
    statusFilter === "전체" ? sales : sales.filter((s) => s.sellStatus === statusFilter);

  return (
    <div>
      {/* 탭 바 */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors",
              tab === t.key
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.icon}
            {t.label}
            {t.count != null && (
              <span className="text-xs text-muted-foreground">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* 판매 물품 */}
      {tab === "sales" && (
        <div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  statusFilter === f
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          {filteredSales.length === 0 ? (
            <Empty icon={<PackageIcon className="size-8" />} text="해당하는 판매 물품이 없습니다." />
          ) : (
            <div className="flex flex-col gap-2">
              {filteredSales.map((s) => (
                <Card key={`${s.cno}-${s.itemNo}`}>
                  <CardContent className="flex items-center gap-3">
                    <Link
                      href={`/items/${s.cno}/${s.itemNo}`}
                      className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground"
                    >
                      {s.photoCount > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/items/${s.cno}/${s.itemNo}/photo/1`}
                          alt={s.title}
                          className="size-full object-cover"
                        />
                      ) : (
                        <ImageOffIcon className="size-5" />
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/items/${s.cno}/${s.itemNo}`} className="hover:underline">
                        <p className="line-clamp-1 font-medium">{s.title}</p>
                      </Link>
                      <p className="mt-0.5 text-sm font-bold">{formatPrice(s.price)}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.category} · 등록 {formatDateTime(s.regDateTime)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={s.sellStatus} />
                      <Link
                        href={`/items/${s.cno}/${s.itemNo}/requests`}
                        className="flex items-center text-xs text-primary hover:underline"
                      >
                        받은 요청 {s.reqCount}건
                        <ChevronRightIcon className="size-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 받은 요청 */}
      {tab === "received" && (
        <div>
          {received.length === 0 ? (
            <Empty icon={<InboxIcon className="size-8" />} text="받은 구매 요청이 없습니다." />
          ) : (
            <div className="flex flex-col gap-2">
              {received.map((r, i) => (
                <Link key={i} href={`/items/${r.cno}/${r.itemNo}/requests`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="line-clamp-1 text-sm text-muted-foreground">
                          {r.itemTitle}
                        </span>
                        <StatusBadge status={r.sellStatus} className="shrink-0" />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {r.requesterNickname}{" "}
                          <span className="text-xs text-muted-foreground">({r.requestCno})</span>
                        </span>
                        <span className="font-bold">{formatPrice(r.reqPrice)}</span>
                      </div>
                      {r.reqMessage && (
                        <p className="line-clamp-1 text-sm text-muted-foreground">{r.reqMessage}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{formatDateTime(r.reqDateTime)}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 보낸 요청 */}
      {tab === "sent" && (
        <div>
          {sent.length === 0 ? (
            <Empty icon={<SendIcon className="size-8" />} text="보낸 구매 요청이 없습니다." />
          ) : (
            <div className="flex flex-col gap-2">
              {sent.map((s, i) => {
                const st = sentStatus(s.sellStatus);
                return (
                  <Link key={i} href={`/items/${s.cno}/${s.itemNo}`}>
                    <Card className="transition-shadow hover:shadow-md">
                      <CardContent className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="line-clamp-1 font-medium">{s.itemTitle}</span>
                          <Badge className={cn("shrink-0 border-transparent", st.cls)}>
                            {st.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-muted-foreground">
                            판매자 {s.sellerNickname}
                          </span>
                          <span>
                            요청가 <b>{formatPrice(s.reqPrice)}</b>
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDateTime(s.reqDateTime)}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 내 정보 */}
      {tab === "profile" && (
        <Card>
          <CardContent className="flex flex-col gap-3 py-5">
            <Row label="회원번호" value={user.cno} />
            <Row label="닉네임" value={user.nickname} />
            <Row label="전화번호" value={user.phone ?? "-"} />
            <Row label="활동 지역" value={user.region ?? "-"} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-muted-foreground">
      {icon}
      <span className="text-sm">{text}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 text-sm last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
