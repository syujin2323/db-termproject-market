// 화면/기능별 SQL 모음. "어떤 화면이 어떤 질의를 쓰는지" 추적 가능하도록 한곳에 모은다.
// 모든 SELECT는 큰따옴표 별칭으로 camelCase 키를 반환한다.

export const AUTH_SQL = {
  /** 로그인: 회원번호 + 비밀번호(평문) 일치 확인 */
  login: `
    SELECT cno AS "cno", nickname AS "nickname", phone AS "phone", region AS "region"
    FROM customer
    WHERE cno = :cno AND passwd = :passwd`,

  /** 세션 cno로 현재 회원 조회 */
  findByCno: `
    SELECT cno AS "cno", nickname AS "nickname", phone AS "phone", region AS "region"
    FROM customer
    WHERE cno = :cno`,
};
