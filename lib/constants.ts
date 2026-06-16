// 프로젝트 전역 상수. 매직 넘버/문자열을 여기 모은다.

/** 관리자 회원번호 (이 계정만 통계 화면 접근 가능) */
export const ADMIN_CNO = "c0";

/** 로그인 세션 쿠키 이름 */
export const SESSION_COOKIE = "session_cno";

/** 예약(승인) 후 자동취소까지의 시간 — SPEC 단계 8 */
export const RESERVATION_TIMEOUT_HOURS = 48;

/** 판매 상태 값 (DB CHECK 제약과 정확히 일치해야 함) */
export const SELL_STATUS = {
  ON_SALE: "판매 중",
  RESERVED: "예약 중",
  DONE: "거래 완료",
} as const;

export type SellStatus = (typeof SELL_STATUS)[keyof typeof SELL_STATUS];

/** 물품 카테고리 (등록/검색 드롭다운에서 사용) */
export const CATEGORIES = [
  "디지털기기",
  "가구",
  "도서",
  "스포츠",
  "티켓",
  "기타",
] as const;

/** 메시지 발신자 구분 — DB CHECK: 'S'(판매자) / 'B'(구매자) */
export const SENDER = { SELLER: "S", BUYER: "B" } as const;
