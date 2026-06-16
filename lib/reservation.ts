// 예약 자동취소 (단계 8). 화면 진입/새로고침 시 호출한다.
// '예약 중'이 된 지 48시간(RESERVATION_TIMEOUT_HOURS)이 지난 물품을
// '판매 중'으로 되돌리고, 그 예약(구매 요청)을 삭제한다.
import "server-only";
import { withTransaction } from "./db";
import { RESERVATION_SQL } from "./queries";
import { RESERVATION_TIMEOUT_HOURS, SELL_STATUS } from "./constants";

/**
 * 만료된 예약을 정리한다. 되돌린 물품 수를 반환.
 * 한 트랜잭션에서 ① 만료 물품의 요청 삭제 → ② 물품을 판매중으로 복귀.
 * (순서 주의: 요청을 먼저 지운 뒤 상태를 바꿔야 EXISTS 조건이 맞는다.)
 */
export async function sweepExpiredReservations(): Promise<number> {
  return withTransaction(async (conn) => {
    await conn.execute(RESERVATION_SQL.deleteExpiredRequests, {
      reserved: SELL_STATUS.RESERVED,
      hours: RESERVATION_TIMEOUT_HOURS,
    });
    const res = await conn.execute(RESERVATION_SQL.revertExpired, {
      onSale: SELL_STATUS.ON_SALE,
      reserved: SELL_STATUS.RESERVED,
      hours: RESERVATION_TIMEOUT_HOURS,
    });
    return res.rowsAffected ?? 0;
  });
}
