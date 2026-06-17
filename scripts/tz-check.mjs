// 타임존 진단: DB 세션 TZ / SYSTIMESTAMP(서버) vs LOCALTIMESTAMP(세션) / node 변환
import oracledb from "oracledb";
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const c = await oracledb.getConnection({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
});
const r = await c.execute(`
  SELECT
    SESSIONTIMEZONE AS "sessTz",
    TO_CHAR(SYSTIMESTAMP, 'YYYY-MM-DD HH24:MI:SS TZR')     AS "sysStr",
    TO_CHAR(LOCALTIMESTAMP, 'YYYY-MM-DD HH24:MI:SS')        AS "localStr",
    TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS TZR') AS "curStr",
    SYSTIMESTAMP   AS "sysDate",
    LOCALTIMESTAMP AS "localDate"
  FROM dual`);
console.log("DB session TZ :", r.rows[0].sessTz);
console.log("SYSTIMESTAMP  :", r.rows[0].sysStr, "(서버 시계)");
console.log("LOCALTIMESTAMP:", r.rows[0].localStr, "(세션 시계)");
console.log("CURRENT_TS    :", r.rows[0].curStr);
console.log("-- node가 JS Date로 변환한 값 --");
console.log("SYSTIMESTAMP →", r.rows[0].sysDate?.toString());
console.log("LOCALTIMESTAMP →", r.rows[0].localDate?.toString());
console.log("-- node 프로세스 --");
console.log("new Date() :", new Date().toString());
console.log("node TZ    :", Intl.DateTimeFormat().resolvedOptions().timeZone);
await c.close();
