// Oracle 커넥션 풀 + 쿼리 헬퍼 (서버 전용).
// CLAUDE.md 규칙: ORM 금지, raw SQL + 바인드 변수, 풀 재사용, Thin 모드.
import "server-only";
import oracledb from "oracledb";

// 행을 객체({ cno, nickname, ... })로 받는다.
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
// BLOB(pic1~3)은 Lob 스트림 대신 Buffer로 바로 받아 다루기 쉽게 한다.
oracledb.fetchAsBuffer = [oracledb.BLOB];

// 개발 중 HMR로 모듈이 다시 로드돼도 풀이 중복 생성되지 않도록 globalThis에 캐시.
const globalForPool = globalThis as unknown as { _oraclePool?: oracledb.Pool };

/** 풀을 한 번만 생성하고 재사용한다. */
export async function getPool(): Promise<oracledb.Pool> {
  if (globalForPool._oraclePool) return globalForPool._oraclePool;
  globalForPool._oraclePool = await oracledb.createPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1,
  });
  return globalForPool._oraclePool;
}

/**
 * SELECT/단순 DML 실행 헬퍼. 기본 autoCommit=true.
 * @returns 행 객체 배열
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  binds: oracledb.BindParameters = {},
  opts: oracledb.ExecuteOptions = {}
): Promise<T[]> {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    const result = await conn.execute<T>(sql, binds, {
      autoCommit: true,
      ...opts,
    });
    return (result.rows ?? []) as T[];
  } finally {
    await conn.close();
  }
}

/**
 * 여러 DML을 한 트랜잭션으로 처리할 때 사용 (예: 승인 → 예약중 + 나머지 요청 삭제).
 * 콜백이 정상 종료하면 commit, 예외가 나면 rollback 한다.
 */
export async function withTransaction<T>(
  fn: (conn: oracledb.Connection) => Promise<T>
): Promise<T> {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    await conn.close();
  }
}
