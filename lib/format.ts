// 화면 표시용 포매팅 헬퍼 (가격/일시). 서버·클라이언트 양쪽에서 사용.

/** 1100000 → "1,100,000원" */
export function formatPrice(n: number | null | undefined): string {
  if (n == null) return "-";
  return n.toLocaleString("ko-KR") + "원";
}

/** Date(또는 직렬화된 문자열) → "2026. 6. 17. 오후 3:21" 형식 */
export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
