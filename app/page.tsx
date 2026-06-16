// 홈. 단계 1에서는 로그인 전/후·권한에 따라 다른 안내를 보여주는 랜딩으로 둔다.
// (실제 물품 목록/검색은 단계 3에서 이 화면을 대체한다.)
import Link from "next/link";
import { PlusIcon, MessageCircleIcon, ChartColumnBigIcon } from "lucide-react";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function Home() {
  const user = await getCurrentUser();
  const admin = isAdmin(user);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {user ? (
            <>
              안녕하세요,{" "}
              <span className="text-primary">
                {admin ? "관리자" : user.nickname}
              </span>
              님 🥕
            </>
          ) : (
            <>우리 동네 중고거래, 🥕 중고마켓</>
          )}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {user
            ? admin
              ? "관리자 계정으로 로그인했습니다. 거래 통계를 확인할 수 있어요."
              : "물품을 등록하고, 검색하고, 채팅으로 거래를 시작해 보세요."
            : "로그인하면 물품 등록과 구매 요청, 1:1 채팅을 이용할 수 있어요."}
        </p>
      </section>

      {/* 비로그인 */}
      {!user && (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>로그인이 필요해요</CardTitle>
            <CardDescription>
              거래 기능을 이용하려면 먼저 로그인하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
              로그인하러 가기
            </Link>
          </CardContent>
        </Card>
      )}

      {/* 일반 회원 */}
      {user && !admin && (
        <div className="grid gap-4 sm:grid-cols-2">
          <QuickCard
            href="/items/new"
            title="물품 등록"
            desc="사진과 함께 판매할 물품을 올려보세요."
            icon={<PlusIcon className="size-5" />}
          />
          <QuickCard
            href="/chat"
            title="채팅"
            desc="구매자·판매자와 1:1로 대화하세요."
            icon={<MessageCircleIcon className="size-5" />}
          />
          <Card className="sm:col-span-2 bg-muted/40">
            <CardContent className="py-4 text-sm text-muted-foreground">
              물품 목록과 상세 검색(제목·카테고리·가격, AND/OR/NOT)은 다음 단계에서
              이 홈 화면에 추가됩니다.
            </CardContent>
          </Card>
        </div>
      )}

      {/* 관리자 */}
      {admin && (
        <QuickCard
          href="/admin/stats"
          title="거래 통계"
          desc="카테고리별 거래 현황과 회원별 거래액 순위를 확인하세요."
          icon={<ChartColumnBigIcon className="size-5" />}
          className="max-w-md"
        />
      )}
    </div>
  );
}

function QuickCard({
  href,
  title,
  desc,
  icon,
  className,
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group block", className)}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              {icon}
            </span>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <CardDescription className="pt-1">{desc}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
