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
       LOCALTIMESTAMP, :sellStatus, :pic1, :pic2, :pic3)`,

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

  /** 거래 완료 (단계 7): 예약 중인 물품만 '거래 완료'로 바꾸고 최종 금액 저장 */
  complete: `
    UPDATE item SET sellStatus = :done, finalPrice = :finalPrice
    WHERE cno = :cno AND itemNo = :itemNo AND sellStatus = :reserved`,
};

export const PURCHASE_SQL = {
  /** 동일 요청자가 이미 이 물품에 요청했는지 (중복 방지) */
  existsForRequester: `
    SELECT COUNT(*) AS "cnt" FROM purchasereq
    WHERE requestCno = :requestCno AND cno = :cno AND itemNo = :itemNo`,

  /** 물품에 달린 구매 요청 수 (판매자 화면 배지용) */
  countForItem: `
    SELECT COUNT(*) AS "cnt" FROM purchasereq WHERE cno = :cno AND itemNo = :itemNo`,

  /** 구매 요청 등록 (요청 금액 + 메시지) */
  insert: `
    INSERT INTO purchasereq (requestCno, cno, itemNo, reqDateTime, reqPrice, reqMessage)
    VALUES (:requestCno, :cno, :itemNo, LOCALTIMESTAMP, :reqPrice, :reqMessage)`,

  /** 한 물품의 받은 요청 목록 (+ 요청자 닉네임) — 판매자 화면 */
  listForItem: `
    SELECT
      p.requestCno   AS "requestCno",
      p.cno          AS "cno",
      p.itemNo       AS "itemNo",
      p.reqDateTime  AS "reqDateTime",
      p.reqPrice     AS "reqPrice",
      p.reqMessage   AS "reqMessage",
      c.nickname     AS "requesterNickname"
    FROM purchasereq p
    JOIN customer c ON c.cno = p.requestCno
    WHERE p.cno = :cno AND p.itemNo = :itemNo
    ORDER BY p.reqDateTime DESC`,

  /**
   * 승인 → 예약 중 (단계 6). 판매 중일 때만 예약 중으로 바꾸고 승인 시각(resDateTime)을
   * 기록한다(48h 자동취소 타이머 시작). rowsAffected=0이면 이미 예약/거래완료 상태.
   */
  approveReserve: `
    UPDATE item SET sellStatus = :reserved, resDateTime = LOCALTIMESTAMP
    WHERE cno = :cno AND itemNo = :itemNo AND sellStatus = :onSale`,

  /** 승인된 요청자(requestCno)를 제외한 나머지 구매 요청 자동 삭제 */
  deleteOthers: `
    DELETE FROM purchasereq
    WHERE cno = :cno AND itemNo = :itemNo AND requestCno <> :requestCno`,

  /** 물품의 모든 구매 요청 삭제 (거래 완료/예약 자동취소 시) */
  deleteForItem: `DELETE FROM purchasereq WHERE cno = :cno AND itemNo = :itemNo`,
};

export const CHAT_SQL = {
  /** (구매자 receiveCno, 판매자 cno, itemNo) 조합의 기존 방 찾기 — 중복 방지 */
  findRoom: `
    SELECT roomNo AS "roomNo" FROM chatroom
    WHERE receiveCno = :receiveCno AND cno = :cno AND itemNo = :itemNo`,

  /** 방 생성 (roomNo는 IDENTITY → RETURNING으로 받음) */
  createRoom: `
    INSERT INTO chatroom (receiveCno, cno, itemNo, createDateTime)
    VALUES (:receiveCno, :cno, :itemNo, LOCALTIMESTAMP)
    RETURNING roomNo INTO :roomNo`,

  /** 방 1개 상세 (+ 물품 제목/판매자·구매자 닉네임) */
  getRoom: `
    SELECT
      r.roomNo       AS "roomNo",
      r.cno          AS "cno",
      r.receiveCno   AS "receiveCno",
      r.itemNo       AS "itemNo",
      i.title        AS "itemTitle",
      i.sellStatus   AS "sellStatus",
      s.nickname     AS "sellerNickname",
      b.nickname     AS "buyerNickname"
    FROM chatroom r
    JOIN item i ON i.cno = r.cno AND i.itemNo = r.itemNo
    JOIN customer s ON s.cno = r.cno
    JOIN customer b ON b.cno = r.receiveCno
    WHERE r.roomNo = :roomNo`,

  /**
   * 내가 참여한 방 목록 (판매자 cno=나 또는 구매자 receiveCno=나).
   * unreadCount = 상대가 보낸 안 읽은 메시지 수
   *   (내가 판매자면 상대='B', 구매자면 상대='S').
   */
  listRooms: `
    SELECT
      r.roomNo          AS "roomNo",
      r.cno             AS "cno",
      r.receiveCno      AS "receiveCno",
      r.itemNo          AS "itemNo",
      r.createDateTime  AS "createDateTime",
      i.title           AS "itemTitle",
      i.sellStatus      AS "sellStatus",
      s.nickname        AS "sellerNickname",
      b.nickname        AS "buyerNickname",
      (SELECT COUNT(*) FROM message m
         WHERE m.roomNo = r.roomNo AND m.isRead = 'N'
           AND m.sender = CASE WHEN r.cno = :me THEN 'B' ELSE 'S' END) AS "unreadCount",
      (SELECT MAX(m.sentDateTime) FROM message m WHERE m.roomNo = r.roomNo) AS "lastTime"
    FROM chatroom r
    JOIN item i ON i.cno = r.cno AND i.itemNo = r.itemNo
    JOIN customer s ON s.cno = r.cno
    JOIN customer b ON b.cno = r.receiveCno
    WHERE r.cno = :me OR r.receiveCno = :me
    ORDER BY NVL((SELECT MAX(m.sentDateTime) FROM message m WHERE m.roomNo = r.roomNo),
                 r.createDateTime) DESC`,

  /** 방의 메시지 목록 (보낸 순) */
  listMessages: `
    SELECT
      seqNo        AS "seqNo",
      sender       AS "sender",
      sentDateTime AS "sentDateTime",
      content      AS "content",
      isRead       AS "isRead"
    FROM message WHERE roomNo = :roomNo ORDER BY seqNo`,

  /** 메시지 전송 (sender 'S'/'B', 기본 안읽음 'N') */
  insertMessage: `
    INSERT INTO message (roomNo, sender, sentDateTime, content, isRead)
    VALUES (:roomNo, :sender, LOCALTIMESTAMP, :content, 'N')`,

  /** 내가 방에 들어가면 상대가 보낸 안 읽은 메시지를 읽음 처리 */
  markRead: `
    UPDATE message SET isRead = 'Y'
    WHERE roomNo = :roomNo AND sender = :otherSender AND isRead = 'N'`,
};

export const RESERVATION_SQL = {
  /**
   * 예약 자동취소 (단계 8). 48시간 초과한 '예약 중' 물품들의 구매 요청을 먼저 지운다.
   * (시간은 바인드 변수 :hours 로 NUMTODSINTERVAL 사용 — 매직넘버는 상수에서.)
   */
  deleteExpiredRequests: `
    DELETE FROM purchasereq pr
    WHERE EXISTS (
      SELECT 1 FROM item i
      WHERE i.cno = pr.cno AND i.itemNo = pr.itemNo
        AND i.sellStatus = :reserved
        AND i.resDateTime < LOCALTIMESTAMP - NUMTODSINTERVAL(:hours, 'HOUR')
    )`,

  /** 48시간 초과한 '예약 중' 물품을 '판매 중'으로 되돌리고 예약시각을 비운다. */
  revertExpired: `
    UPDATE item SET sellStatus = :onSale, resDateTime = NULL
    WHERE sellStatus = :reserved
      AND resDateTime < LOCALTIMESTAMP - NUMTODSINTERVAL(:hours, 'HOUR')`,
};

// 관리자 통계 (단계 9). 거래 완료(:done) 물품의 finalPrice 기준.
// ※ TP-5에서 만든 질의가 있으면 이 두 SQL을 그대로 교체하면 된다.
export const STATS_SQL = {
  /** 그룹 함수 통계: 카테고리별 거래 건수/총액/평균 + ROLLUP 전체 합계 */
  categoryRollup: `
    SELECT
      CASE WHEN GROUPING(category) = 1 THEN '전체' ELSE category END AS "category",
      COUNT(*)               AS "dealCount",
      SUM(finalPrice)        AS "totalAmount",
      ROUND(AVG(finalPrice)) AS "avgAmount",
      GROUPING(category)     AS "isTotal"
    FROM item
    WHERE sellStatus = :done
    GROUP BY ROLLUP(category)
    ORDER BY GROUPING(category), SUM(finalPrice) DESC`,

  /** 윈도우 함수 통계: 판매자별 거래액 순위 (RANK() OVER) */
  sellerRanking: `
    SELECT
      i.cno             AS "cno",
      c.nickname        AS "nickname",
      COUNT(*)          AS "dealCount",
      SUM(i.finalPrice) AS "totalAmount",
      RANK() OVER (ORDER BY SUM(i.finalPrice) DESC) AS "rank"
    FROM item i
    JOIN customer c ON c.cno = i.cno
    WHERE i.sellStatus = :done
    GROUP BY i.cno, c.nickname
    ORDER BY SUM(i.finalPrice) DESC`,
};

// 마이페이지 (TP-6 Page_mySales / Page_reqReceived / Page_myReqSent)
export const MYPAGE_SQL = {
  /** 내 판매 물품 (+ 받은 요청 수) */
  mySales: `
    SELECT
      i.cno AS "cno", i.itemNo AS "itemNo", i.title AS "title", i.category AS "category",
      i.price AS "price", i.sellStatus AS "sellStatus", i.regDateTime AS "regDateTime",
      i.finalPrice AS "finalPrice",
      (CASE WHEN i.pic1 IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN i.pic2 IS NOT NULL THEN 1 ELSE 0 END
       + CASE WHEN i.pic3 IS NOT NULL THEN 1 ELSE 0 END) AS "photoCount",
      (SELECT COUNT(*) FROM purchasereq p WHERE p.cno = i.cno AND p.itemNo = i.itemNo) AS "reqCount"
    FROM item i
    WHERE i.cno = :me
    ORDER BY i.regDateTime DESC`,

  /** 내 물품들에 들어온 받은 구매요청 전체 */
  receivedRequests: `
    SELECT
      p.requestCno AS "requestCno", c.nickname AS "requesterNickname",
      p.cno AS "cno", p.itemNo AS "itemNo", i.title AS "itemTitle", i.sellStatus AS "sellStatus",
      p.reqPrice AS "reqPrice", p.reqMessage AS "reqMessage", p.reqDateTime AS "reqDateTime"
    FROM purchasereq p
    JOIN item i ON i.cno = p.cno AND i.itemNo = p.itemNo
    JOIN customer c ON c.cno = p.requestCno
    WHERE i.cno = :me
    ORDER BY p.reqDateTime DESC`,

  /** 내가 보낸 구매요청 (+ 대상 물품 상태로 대기/승인 판별) */
  sentRequests: `
    SELECT
      p.cno AS "cno", p.itemNo AS "itemNo", i.title AS "itemTitle", i.sellStatus AS "sellStatus",
      i.price AS "itemPrice", p.reqPrice AS "reqPrice", p.reqMessage AS "reqMessage",
      p.reqDateTime AS "reqDateTime", sc.nickname AS "sellerNickname"
    FROM purchasereq p
    JOIN item i ON i.cno = p.cno AND i.itemNo = p.itemNo
    JOIN customer sc ON sc.cno = p.cno
    WHERE p.requestCno = :me
    ORDER BY p.reqDateTime DESC`,
};

// 관리자 콘솔 (TP-6 Page_adminHome / Page_adminMember / Page_adminItem)
export const ADMIN_SQL = {
  /** 관리자 홈 요약 지표 (관리자 c0 제외한 회원 수 등) */
  summary: `
    SELECT
      (SELECT COUNT(*) FROM customer WHERE cno <> :admin)         AS "memberCount",
      (SELECT COUNT(*) FROM item)                                  AS "itemCount",
      (SELECT COUNT(*) FROM item WHERE sellStatus = :done)         AS "doneCount",
      (SELECT COUNT(*) FROM item WHERE sellStatus = :reserved)     AS "reservedCount"
    FROM dual`,

  /** 회원 목록 (+ 등록 물품 수). 관리자 자신은 제외. */
  members: `
    SELECT
      c.cno AS "cno", c.nickname AS "nickname", c.phone AS "phone", c.region AS "region",
      (SELECT COUNT(*) FROM item i WHERE i.cno = c.cno) AS "itemCount"
    FROM customer c
    WHERE c.cno <> :admin
    ORDER BY c.cno`,

  /** 전체 물품/거래 목록 (판매자 닉네임·지역 포함) */
  items: `
    SELECT
      i.cno AS "cno", i.itemNo AS "itemNo", i.title AS "title", i.category AS "category",
      i.price AS "price", i.sellStatus AS "sellStatus", i.finalPrice AS "finalPrice",
      i.regDateTime AS "regDateTime", c.nickname AS "sellerNickname", c.region AS "sellerRegion"
    FROM item i JOIN customer c ON c.cno = i.cno
    ORDER BY i.regDateTime DESC`,

  // 물품 강제 삭제 (FK 때문에 자식 테이블부터 순서대로)
  deleteMessagesOfItem: `
    DELETE FROM message WHERE roomNo IN
      (SELECT roomNo FROM chatroom WHERE cno = :cno AND itemNo = :itemNo)`,
  deleteChatroomsOfItem: `DELETE FROM chatroom WHERE cno = :cno AND itemNo = :itemNo`,
  deleteRequestsOfItem: `DELETE FROM purchasereq WHERE cno = :cno AND itemNo = :itemNo`,
  deleteItem: `DELETE FROM item WHERE cno = :cno AND itemNo = :itemNo`,
};
