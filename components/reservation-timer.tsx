"use client";

// 예약 수락 시각 + 48시간 자동취소까지 남은 시간(실시간 카운트다운).
// resDateTime(예약 시각)만 받아 화면에서 계산하므로 DB를 수정하지 않는다.
import { useEffect, useState } from "react";
import { RESERVATION_TIMEOUT_HOURS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";

export function ReservationTimer({
  resDateTime,
}: {
  resDateTime: string | Date | null;
}) {
  const [now, setNow] = useState<number | null>(null);

  // 마운트 후에만 시계를 돌려 서버/클라이언트 하이드레이션 불일치를 피한다.
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!resDateTime) return null;
  const accepted = new Date(resDateTime);
  const deadline = accepted.getTime() + RESERVATION_TIMEOUT_HOURS * 3600 * 1000;
  const acceptedText = formatDateTime(resDateTime);

  // 마운트 전(SSR/첫 렌더)에는 카운트다운 없이 예약 시각만 보여준다.
  if (now === null) {
    return <>예약 수락 {acceptedText} · 자동취소까지 계산 중…</>;
  }

  const ms = deadline - now;
  if (ms <= 0) {
    return (
      <>
        예약 수락 {acceptedText} · <b>48시간 경과</b> — 새로고침 시 ‘판매 중’으로 자동
        복귀됩니다.
      </>
    );
  }
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return (
    <>
      예약 수락 {acceptedText} · 자동취소까지 <b>{h}시간 {m}분 {s}초</b> 남음
    </>
  );
}
