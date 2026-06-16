// 현재 로그인 사용자 조회 및 권한 헬퍼 (서버 전용).
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { query } from "./db";
import { AUTH_SQL } from "./queries";
import { getSessionCno } from "./session";
import { ADMIN_CNO } from "./constants";
import type { Customer } from "./types";

/**
 * 현재 로그인한 회원. 비로그인 시 null.
 * React cache로 한 요청 안에서 중복 호출(Header + 페이지)을 한 번의 쿼리로 합친다.
 */
export const getCurrentUser = cache(async (): Promise<Customer | null> => {
  const cno = await getSessionCno();
  if (!cno) return null;
  const rows = await query<Customer>(AUTH_SQL.findByCno, { cno });
  return rows[0] ?? null;
});

/** 관리자(c0) 여부 */
export function isAdmin(user: Customer | null): boolean {
  return user?.cno === ADMIN_CNO;
}

/** 로그인 필수 페이지: 비로그인 시 /login 으로 보냄. */
export async function requireUser(): Promise<Customer> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** 관리자 전용 페이지: 비관리자는 홈으로 보냄. */
export async function requireAdmin(): Promise<Customer> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) redirect("/");
  return user;
}
