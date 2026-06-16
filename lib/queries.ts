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

export const ITEM_SQL = {
  /** 판매자별 다음 itemNo 채번 (1,2,3…). 트랜잭션 안에서 INSERT와 함께 실행. */
  nextItemNo: `SELECT NVL(MAX(itemNo), 0) + 1 AS "next" FROM item WHERE cno = :cno`,

  /** 물품 등록. regDateTime=현재시각, 기본 상태 '판매 중', 사진은 BLOB pic1~3. */
  insert: `
    INSERT INTO item
      (cno, itemNo, title, description, category, price, tradePlace,
       regDateTime, sellStatus, pic1, pic2, pic3)
    VALUES
      (:cno, :itemNo, :title, :description, :category, :price, :tradePlace,
       SYSTIMESTAMP, :sellStatus, :pic1, :pic2, :pic3)`,

  /** 상세 조회 (+ 판매자 닉네임, 사진 보유 슬롯 수). */
  getById: `
    SELECT
      i.cno          AS "cno",
      i.itemNo       AS "itemNo",
      i.title        AS "title",
      i.description  AS "description",
      i.category     AS "category",
      i.price        AS "price",
      i.tradePlace   AS "tradePlace",
      i.regDateTime  AS "regDateTime",
      i.resDateTime  AS "resDateTime",
      i.sellStatus   AS "sellStatus",
      i.finalPrice   AS "finalPrice",
      (CASE WHEN i.pic1 IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN i.pic2 IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN i.pic3 IS NOT NULL THEN 1 ELSE 0 END) AS "photoCount",
      c.nickname     AS "sellerNickname"
    FROM item i
    JOIN customer c ON c.cno = i.cno
    WHERE i.cno = :cno AND i.itemNo = :itemNo`,

  /** 사진 1장(BLOB) 조회. 컬럼명은 화이트리스트로만 치환한다. */
  photo: (col: "pic1" | "pic2" | "pic3") =>
    `SELECT ${col} AS "pic" FROM item WHERE cno = :cno AND itemNo = :itemNo`,

  /**
   * 목록/검색용 SELECT 프리픽스. 뒤에 buildItemSearch()의 WHERE/ORDER BY를 붙인다.
   * 썸네일용 photoCount, 판매자 닉네임/지역을 함께 조회한다.
   */
  listSelect: `
    SELECT
      i.cno          AS "cno",
      i.itemNo       AS "itemNo",
      i.title        AS "title",
      i.category     AS "category",
      i.price        AS "price",
      i.tradePlace   AS "tradePlace",
      i.sellStatus   AS "sellStatus",
      i.regDateTime  AS "regDateTime",
      i.finalPrice   AS "finalPrice",
      (CASE WHEN i.pic1 IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN i.pic2 IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN i.pic3 IS NOT NULL THEN 1 ELSE 0 END) AS "photoCount",
      c.nickname     AS "sellerNickname",
      c.region       AS "sellerRegion"
    FROM item i
    JOIN customer c ON c.cno = i.cno`,
};
