// Oracle 접속 테스트 스크립트 (0단계 검증용)
// 실행: node --env-file=.env.local scripts/test-db.mjs
// node-oracledb Thin 모드(기본). initOracleClient() 호출하지 않는다.
import oracledb from "oracledb";

const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;

// .env.local에 적힌 연결 문자열 + 검증용 대체 후보들을 차례로 시도한다.
const candidates = [
  { label: ".env.local의 DB_CONNECT_STRING", cs: process.env.DB_CONNECT_STRING },
  { label: "Easy Connect 서비스명 XE(대문자)", cs: "localhost:1521/XE" },
  { label: "Easy Connect 서비스명 xe(소문자)", cs: "localhost:1521/xe" },
];

async function tryConnect({ label, cs }) {
  if (!cs) return { label, ok: false, error: "(연결 문자열 없음)" };
  let conn;
  try {
    conn = await oracledb.getConnection({ user, password, connectString: cs });
    const r = await conn.execute(
      `SELECT USER AS who, (SELECT COUNT(*) FROM customer) AS customers FROM dual`
    );
    return { label, cs, ok: true, who: r.rows[0][0], customers: r.rows[0][1] };
  } catch (e) {
    return { label, cs, ok: false, error: e.message };
  } finally {
    if (conn) await conn.close();
  }
}

const results = [];
for (const c of candidates) {
  const res = await tryConnect(c);
  results.push(res);
  if (res.ok) {
    console.log(`✅ 접속 성공 — ${res.label}`);
    console.log(`   connectString: ${res.cs}`);
    console.log(`   USER=${res.who}, CUSTOMER 행수=${res.customers}`);
    process.exit(0);
  } else {
    console.log(`❌ 실패 — ${c.label}: ${res.error}`);
  }
}
console.error("\n모든 후보 접속에 실패했습니다.");
process.exit(1);
