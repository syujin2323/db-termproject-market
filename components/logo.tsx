"use client";

// 로고 — 항상 "깨끗한 홈"으로 이동.
// 이미 홈(/)에 있고 검색·상태필터를 적용한 상태에서 누르면, 같은 경로라
// 클라이언트 상태가 유지돼 화면이 안 바뀐다. 그 경우 새로고침으로 초기화한다.
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Logo() {
  const pathname = usePathname();

  function onClick(e: React.MouseEvent) {
    if (pathname === "/") {
      e.preventDefault();
      window.location.assign("/"); // 적용된 필터/검색까지 초기화
    }
    // 다른 페이지에서는 Link 기본 동작으로 홈이 새로 마운트되며 초기화된다.
  }

  return (
    <Link
      href="/"
      onClick={onClick}
      className="mr-3 text-lg font-bold tracking-tight"
    >
      <span className="text-primary">🥕 중고마켓</span>
    </Link>
  );
}
