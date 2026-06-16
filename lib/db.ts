// Oracle 커넥션 풀 + 쿼리 헬퍼 (서버 전용).
// CLAUDE.md 규칙: ORM 금지, raw SQL + 바인드 변수, 풀 재사용, Thin 모드.
import "server-only";
import oracledb from "oracledb";

// 행을 객체({ cno, nickname, ... })로 받는다.
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
// BLOB(pic1~3)은 Lob 스트림 대신 Buffer로 바로 받아 다루기 쉽게 한다.
oracledb.fetchAsBuffer = [oracledb.BLOB];

// 개발 중 HMR로 모듈이 다시 로드돼도 풀/직렬화 체인이 유지되도록 globalThis에 캐시.
const globalForDb = globalThis as unknown as {
  _oraclePool?: oracledb.Pool;
  _oraclePoolInit?: Promise<oracledb.Pool>;
  _dbChain?: Promise<unknown>;
};

/**
 * 풀을 한 번만 생성하고 재사용한다.
 * 동시 첫 요청들이 createPool을 중복 호출하지 않도록 init 프로미스로 가드한다.
 * poolMax=1: node-oracledb Thin 모드는 한 프로세스 안에서 동시 작업 시 버퍼 오류를
 * 일으키므로, 프로세스당 커넥션을 1개로 제한해 DB 작업을 직렬화한다(데모 규모에서 충분).
 */
export async function getPool(): Promise<oracledb.Pool> {
  if (globalForDb._oraclePool) return globalForDb._oraclePool;
  if (!globalForDb._oraclePoolInit) {
    globalForDb._oraclePoolInit = oracledb
      .createPool({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING,
        poolMin: 1,
        poolMax: 10,
        poolIncrement: 1,
        queueTimeout: 15000, // 커넥션 대기 최대 15초
      })
      .then((pool) => {
        globalForDb._oraclePool = pool;
        return pool;
      });
  }
  return globalForDb._oraclePoolInit;
}

/**
 * 모든 DB 작업을 한 번에 하나씩만 실행하도록 직렬화한다.
 * node-oracledb Thin 모드는 여러 작업이 동시에 진행되면 드물게
 * ERR_BUFFER_OUT_OF_BOUNDS(버퍼 범위 초과)를 일으킨다. 서버 컴포넌트는
 * 레이아웃(헤더)과 페이지 쿼리를 동시에 렌더하므로, 이를 직렬화해 막는다.
 * (데모 규모에서 직렬화 비용은 무시할 수준이다.)
 */
function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const prev = globalForDb._dbChain ?? Promise.resolve();
  const run = prev.then(fn, fn);
  // 성공/실패와 무관하게 다음 작업이 이어지도록 체인을 갱신한다.
  globalForDb._dbChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
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
  return runExclusive(async () => {
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
  });
}

/**
 * 여러 DML을 한 트랜잭션으로 처리할 때 사용 (예: 승인 → 예약중 + 나머지 요청 삭제).
 * 콜백이 정상 종료하면 commit, 예외가 나면 rollback 한다.
 * (주의: 콜백 안에서는 conn.execute를 직접 쓴다. 전역 query()를 호출하면 교착될 수 있다.)
 */
export async function withTransaction<T>(
  fn: (conn: oracledb.Connection) => Promise<T>
): Promise<T> {
  return runExclusive(async () => {
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
  });
}
