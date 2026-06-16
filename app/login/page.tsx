"use client";

// 단계 1 — 로그인 화면. 회원번호 + 비밀번호로 로그인한다.
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [cno, setCno] = useState("");
  const [passwd, setPasswd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!cno.trim() || !passwd.trim()) {
      setError("회원번호와 비밀번호를 모두 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cno: cno.trim(), passwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }
      toast.success(`${data.user.nickname}님, 환영합니다!`);
      router.push("/");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-4 py-10">
      <Card className="p-2">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>회원번호와 비밀번호를 입력하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cno">회원번호</Label>
              <Input
                id="cno"
                value={cno}
                onChange={(e) => setCno(e.target.value)}
                placeholder="예: c1"
                autoComplete="username"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="passwd">비밀번호</Label>
              <Input
                id="passwd"
                type="password"
                value={passwd}
                onChange={(e) => setPasswd(e.target.value)}
                placeholder="비밀번호"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-1" disabled={loading}>
              {loading ? "로그인 중…" : "로그인"}
            </Button>
          </form>

          {/* 데모용 계정 안내 */}
          <div className="mt-5 rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">데모 계정</p>
            <p>판매자 A · 구매자 B/C 등: <b>c1 ~ c10</b> / 비밀번호 <b>pw1234</b></p>
            <p>관리자: <b>c0</b> / 비밀번호 <b>admin1234</b></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
