# 중고마켓 — 온라인 중고거래 플랫폼

데이터베이스 텀 프로젝트. 당근마켓 스타일의 중고거래 플랫폼이다. 회원이 물품을 등록·검색하고,
구매 요청과 1:1 채팅으로 거래를 진행하며, 판매자가 요청을 승인(예약)하고 최종 금액을 입력해
거래를 완료한다. 관리자(c0)는 전용 콘솔에서 회원·물품/거래를 관리하고 거래 통계를 조회한다.

모든 DB 접근은 ORM 없이 **raw SQL + 바인드 변수**로 처리한다.

## 기술 스택

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Oracle Database 21c XE** + **node-oracledb**(Thin 모드)
- Tailwind CSS + shadcn/ui, 한글 폰트 Pretendard

## 요구 사항

- Node.js 20 이상
- 실행 중인 **Oracle Database 21c XE** (`localhost:1521`) — Docker 사용 권장

---

## 다른 컴퓨터에서 실행하기 (GitHub clone → 실행)

### 1) 소스 클론 & 의존성 설치
```bash
git clone https://github.com/syujin2323/db-termproject-market.git
cd db-termproject-market
npm install
```

### 2) Oracle 21c XE 실행 (Docker 예시)
```bash
# 예시 이미지 — XE 21c. 컨테이너가 뜨고 DB가 준비될 때까지 1~2분 대기
docker run -d --name oracle21c -p 1521:1521 jamj2000/oracle-xe-21c
# (macOS에서 Colima 사용 시: colima start 후 위 명령 실행)
```
> 이미 Oracle 21c XE가 `localhost:1521`에서 실행 중이면 이 단계는 생략한다.

### 3) 스키마 + 시드 데이터 적재
SQL Developer 또는 sqlplus로 DB 계정(예: 본인 계정)에 접속한 뒤, 아래 두 파일을 **순서대로** 실행한다.
```
db/schema.sql   -- 5개 테이블 + 제약 생성 (CUSTOMER, ITEM, PURCHASEREQ, CHATROOM, MESSAGE)
db/seed.sql     -- 데모 데이터(회원 11, 물품 37, 요청 11, 채팅방 3, 메시지 10)
```
> 사진(BLOB)은 시드에 없으므로 데모 중 직접 등록해 확인하면 된다.

### 4) DB 접속 정보 설정 — 루트에 `.env.local` 생성
```env
DB_USER=본인_계정
DB_PASSWORD=본인_비밀번호
DB_CONNECT_STRING=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))(CONNECT_DATA=(SID=xe)))
```
> `.env.local`은 비밀번호를 담으므로 저장소에 포함되지 않는다(.gitignore). 접속이 안 되면
> connectString을 서비스명 방식 `localhost:1521/XE` 로도 시도한다.

### 5) 개발 서버 실행
```bash
npm run dev          # → http://localhost:3000
```

---

## 데모 계정

| 구분 | 회원번호 | 비밀번호 |
|---|---|---|
| 일반 회원 | `c1` ~ `c10` | `pw1234` |
| 관리자 | `c0` | `admin1234` |

판매자 A=`c1`, 구매자 B=`c3`, 구매자 C=`c4` 시나리오로 거래 흐름을 시연할 수 있다.

## 데모 데이터 백업/복원

```bash
npm run db:backup    # 현재 DB 상태를 bak_* 테이블로 백업
npm run db:reset     # 백업 시점으로 5개 테이블 원상 복구
                     #  (+ '예약 중' 물품의 예약시각을 현재로 갱신 → 48h 자동취소에 바로 안 사라짐)
```
> 시연 전 `npm run db:reset` 을 실행하면 신선한 데모 데이터(‘예약 중’ 물품 포함)가 준비된다.

## 폴더 구조

```
app/          라우트(페이지) + API(Route Handler, DB 접근)
components/   화면 컴포넌트 (shadcn/ui 기반)
lib/          DB·유틸 (db.ts, queries.ts(모든 SQL), search.ts, reservation.ts, auth.ts …)
db/           schema.sql(테이블 DDL), seed.sql(데모 데이터)
scripts/      접속테스트 · 백업/복원(db-snapshot) · 시드 생성 등
```

## 주요 기능

로그인·권한 분리 · 물품 등록(사진 BLOB) · 검색(AND/OR/NOT·정렬·상태필터) · 구매 요청(여러 명) ·
1:1 채팅(읽음·안읽음) · 승인→예약 중(나머지 요청 자동삭제) · 거래 완료(finalPrice) ·
48시간 예약 자동취소 · 마이페이지 · 관리자 콘솔(회원·물품/거래 관리) · 통계(GROUP BY ROLLUP / 윈도우 함수)
