// Oracle DB 접근 헬퍼 (서버 전용). CLAUDE.md 규칙: ORM 금지, raw SQL + 바인드 변수, Thin 모드.
//
// ⚠️ 커넥션 풀을 쓰지 않고 "매 쿼리마다 새 커넥션"을 연다.
//    node-oracledb Thin 모드는 Next.js(Turbopack) 런타임에서, 풀로 재사용된 커넥션의
//    "두 번째 실행"부터 RangeError(ERR_BUFFER_OUT_OF_BOUNDS, 버퍼 범위 초과)를 일으킨다.
//    (동일 코드를 단독 Node 스크립트로 돌리면 풀 재사용도 정상이라, Next 런타임 특유의 문제로 확인됨.)
//    매번 새 커넥션을 열면 항상 "첫 실행"이라 안전하다. 데모 규모(단일 사용자)에서는
//    커넥션 생성 비용도 무시할 수준이다.
import "server-only";
import oracledb from "oracledb";

// 행을 객체({ cno, nickname, ... })로 받는다.
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
// BLOB(pic1~3)은 Lob 스트림 대신 Buffer로 바로 받아 다루기 쉽게 한다.
oracledb.fetchAsBuffer = [oracledb.BLOB];

/** 새 커넥션을 연다 (.env.local 접속 정보 사용). */
function connect(): Promise<oracledb.Connection> {
  return oracledb.getConnection({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
  });
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
  const conn = await connect();
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
 * (콜백 안에서는 전달받은 conn.execute를 직접 쓴다. autoCommit 없이 마지막에 commit.)
 */
export async function withTransaction<T>(
  fn: (conn: oracledb.Connection) => Promise<T>
): Promise<T> {
  const conn = await connect();
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
