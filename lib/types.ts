// DB 행 → 앱에서 쓰는 타입. SELECT 시 컬럼을 큰따옴표 별칭("cno" 등)으로
// camelCase 키를 받는 컨벤션을 쓴다(오라클 기본 대문자 키 회피).
import type { SellStatus } from "./constants";

export interface Customer {
  cno: string;
  nickname: string;
  phone: string | null;
  region: string | null;
}

export interface Item {
  cno: string; // 판매자
  itemNo: number;
  title: string;
  description: string | null;
  category: string;
  price: number;
  tradePlace: string | null;
  regDateTime: Date;
  resDateTime: Date | null;
  sellStatus: SellStatus;
  finalPrice: number | null;
  /** 사진 보유 여부(pic1~3 중 존재하는 슬롯) — 목록/상세에서 이미지 URL 구성에 사용 */
  photoCount?: number;
  sellerNickname?: string;
  sellerRegion?: string | null;
}

export interface PurchaseReq {
  requestCno: string; // 요청자
  cno: string; // 대상 물품 판매자
  itemNo: number;
  reqDateTime: Date;
  reqPrice: number | null;
  reqMessage: string | null;
  requesterNickname?: string;
}

export interface ChatRoom {
  roomNo: number;
  receiveCno: string; // 구매자
  cno: string; // 판매자
  itemNo: number;
  createDateTime?: Date;
  itemTitle?: string;
  sellStatus?: string;
  sellerNickname?: string;
  buyerNickname?: string;
  unreadCount?: number;
  lastTime?: Date | null;
}

export interface Message {
  roomNo: number;
  seqNo: number;
  sender: "S" | "B";
  sentDateTime: Date;
  content: string;
  isRead: "Y" | "N";
}
