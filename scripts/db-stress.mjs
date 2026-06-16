// node-oracledb Thin 모드 단독 스트레스 테스트 (Next.js 없이 원인 격리).
// 실행: node --env-file=.env.local scripts/db-stress.mjs
import oracledb from "oracledb";

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsBuffer = [oracledb.BLOB];

// 앱과 동일하게 TIMESTAMP/조인/CASE(사진수)를 포함한 대표 쿼리
const LIST = `
  SELECT i.cno AS "cno", i.itemNo AS "itemNo", i.title AS "title",
         i.price AS "price", i.regDateTime AS "regDateTime", i.resDateTime AS "resDateTime",
         (CASE WHEN i.pic1 IS NOT NULL THEN 1 ELSE 0 END) AS "photoCount",
         c.nickname AS "sellerNickname"
  FROM item i JOIN customer c ON c.cno = i.cno
  ORDER BY i.regDateTime DESC`;
const CUST = `SELECT cno AS "cno", nickname AS "nickname" FROM customer WHERE cno = :cno`;

async function runOnce(pool, sql, binds = {}) {
  const conn = await pool.getConnection();
  try {
    await conn.execute(sql, binds);
    return null;
  } catch (e) {
    return e.code || e.message;
  } finally {
    await conn.close();
  }
}

// 동시 N개 (직렬화 없음)
async function concurrent(pool, n) {
  const tasks = [];
  for (let i = 0; i < n; i++) {
    // 헤더(customer) + 페이지(list)가 동시에 도는 상황을 흉내
    tasks.push(runOnce(pool, i % 2 ? CUST : LIST, i % 2 ? { cno: "c1" } : {}));
  }
  const results = await Promise.all(tasks);
  return results.filter(Boolean);
}

// 직렬 N개 (한 번에 하나씩)
async function serial(pool, n) {
  const errs = [];
  for (let i = 0; i < n; i++) {
    const e = await runOnce(pool, i % 2 ? CUST : LIST, i % 2 ? { cno: "c1" } : {});
    if (e) errs.push(e);
  }
  return errs;
}

async function main() {
  console.log("node", process.version, "| oracledb", oracledb.versionString, "| thin:", oracledb.thin);

  const pool = await oracledb.createPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1,
  });

  // 1) 콜드 동시 20 (풀 생성 직후, 워밍업 없음)
  let errs = await concurrent(pool, 20);
  console.log(`[콜드 동시 20] 오류 ${errs.length}건`, errs.slice(0, 5));

  // 2) 콜드 직후 직렬 20
  errs = await serial(pool, 20);
  console.log(`[직렬 20]      오류 ${errs.length}건`, errs.slice(0, 5));

  // 3) 워밍업 후 동시 20
  errs = await concurrent(pool, 20);
  console.log(`[워밍 동시 20] 오류 ${errs.length}건`, errs.slice(0, 5));

  await pool.close(0);
}

main().catch((e) => {
  console.error("스크립트 오류:", e);
  process.exit(1);
});
