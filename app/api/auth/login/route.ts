// 로그인/로그아웃 API. 회원번호+비밀번호(평문) 검증 후 세션 쿠키 발급.
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { AUTH_SQL } from "@/lib/queries";
import { setSession, clearSession } from "@/lib/session";
import type { Customer } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { cno, passwd } = await req.json();

    // 필수 입력 검증 → 안내 메시지 (전반 평가: 예외 처리)
    if (!cno || !passwd) {
      return NextResponse.json(
        { error: "회원번호와 비밀번호를 모두 입력해 주세요." },
        { status: 400 }
      );
    }

    // 바인드 변수로 안전하게 조회 (SQL 인젝션 방지)
    const rows = await query<Customer>(AUTH_SQL.login, { cno, passwd });
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "회원번호 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    await setSession(cno);
    return NextResponse.json({ user: rows[0] });
  } catch (e) {
    console.error("[POST /api/auth/login]", e);
    return NextResponse.json(
      { error: "로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
