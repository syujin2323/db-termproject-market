// 판매 상태 배지. 색으로 상태를 한눈에 구분한다.
// 판매 중=초록 / 예약 중=주황(amber) / 거래 완료=회색.
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SELL_STATUS } from "@/lib/constants";

const STATUS_STYLE: Record<string, string> = {
  [SELL_STATUS.ON_SALE]: "bg-emerald-100 text-emerald-700",
  [SELL_STATUS.RESERVED]: "bg-amber-100 text-amber-800",
  [SELL_STATUS.DONE]: "bg-zinc-200 text-zinc-600",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        "border-transparent",
        STATUS_STYLE[status] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {status}
    </Badge>
  );
}
