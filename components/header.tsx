// 상단 공통 헤더 (서버 컴포넌트). 로그인 상태/권한에 따라 메뉴가 달라진다.
import Link from "next/link";
import {
  PlusIcon,
  MessageCircleIcon,
  ChartColumnBigIcon,
  UserIcon,
} from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { AuthArea } from "@/components/auth-area";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function Header() {
  const user = await getCurrentUser();
  const admin = isAdmin(user);
  const navLink = cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5");

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-1 px-4">
        <Link href="/" className="mr-3 text-lg font-bold tracking-tight">
          <span className="text-primary">🥕 중고마켓</span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {/* 일반 회원: 등록/채팅 */}
          {user && !admin && (
            <>
              <Link href="/items/new" className={navLink}>
                <PlusIcon /> 물품 등록
              </Link>
              <Link href="/chat" className={navLink}>
                <MessageCircleIcon /> 채팅
              </Link>
              <Link href="/mypage" className={navLink}>
                <UserIcon /> 마이페이지
              </Link>
            </>
          )}
          {/* 관리자: 통계 */}
          {admin && (
            <Link href="/admin/stats" className={navLink}>
              <ChartColumnBigIcon /> 통계
            </Link>
          )}
        </nav>

        <div className="ml-auto">
          <AuthArea user={user} admin={admin} />
        </div>
      </div>
    </header>
  );
}
