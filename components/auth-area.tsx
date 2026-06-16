"use client";

// 헤더 우측 영역: 로그인 상태면 닉네임+로그아웃, 아니면 로그인 버튼.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LogOutIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/types";

export function AuthArea({
  user,
  admin,
}: {
  user: Customer | null;
  admin: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <Link href="/login" className={cn(buttonVariants({ size: "sm" }))}>
        로그인
      </Link>
    );
  }

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/login", { method: "DELETE" });
      toast.success("로그아웃되었습니다.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("로그아웃 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted-foreground sm:inline">
        <b className="font-medium text-foreground">
          {admin ? "관리자" : user.nickname}
        </b>
        님
      </span>
      <Button variant="outline" size="sm" onClick={logout} disabled={loading}>
        <LogOutIcon /> 로그아웃
      </Button>
    </div>
  );
}
