"use client";

// 회원 관리 (C단계, Page_adminMember) — 닉네임/회원번호 검색 + 목록.
import { useState } from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export interface MemberRow {
  cno: string;
  nickname: string;
  phone: string | null;
  region: string | null;
  itemCount: number;
}

export function AdminMembers({ members }: { members: MemberRow[] }) {
  const [q, setQ] = useState("");
  const kw = q.trim().toLowerCase();
  const filtered = kw
    ? members.filter(
        (m) =>
          m.nickname.toLowerCase().includes(kw) || m.cno.toLowerCase().includes(kw)
      )
    : members;

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="닉네임 또는 회원번호 검색"
          className="pl-9"
        />
      </div>

      <p className="mb-2 text-sm text-muted-foreground">
        총 <b className="text-foreground">{filtered.length}</b>명
      </p>

      <Card>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 font-medium">회원번호</th>
                <th className="py-2 font-medium">닉네임</th>
                <th className="py-2 font-medium">전화번호</th>
                <th className="py-2 font-medium">활동 지역</th>
                <th className="py-2 text-right font-medium">등록 물품</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.cno} className="border-b border-border/60">
                    <td className="py-2 font-mono text-xs">{m.cno}</td>
                    <td className="py-2 font-medium">{m.nickname}</td>
                    <td className="py-2 text-muted-foreground">{m.phone ?? "-"}</td>
                    <td className="py-2 text-muted-foreground">{m.region ?? "-"}</td>
                    <td className="py-2 text-right tabular-nums">{m.itemCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
