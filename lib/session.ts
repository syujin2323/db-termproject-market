// 쿠키 기반 로그인 세션 (서버 전용). 세션에는 회원번호(cno)만 담는다.
import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./constants";

/** 현재 세션의 cno (없으면 null). 서버 컴포넌트/라우트에서 호출. */
export async function getSessionCno(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/** 로그인 성공 시 호출 — Route Handler/Server Action 안에서만 가능. */
export async function setSession(cno: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, cno, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7일
  });
}

/** 로그아웃 */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
