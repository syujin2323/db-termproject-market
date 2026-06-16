# CLAUDE.md

> Claude Code가 매 세션 자동으로 읽는 프로젝트 메모리 파일.
> 이 프로젝트의 **기술 결정·제약·디자인 언어**를 정의한다. 작업 시 항상 따른다.

---

## 프로젝트 개요

데이터베이스 과목 텀 프로젝트. **당근마켓 스타일 중고거래 플랫폼**을 구현한다.
구현/데모 기준은 **`SPEC.md`** 에 정리되어 있다. **모든 기능은 SPEC.md의 수락 기준을 그대로 만족시키는 것이 목표**다.

관련 문서:
- `SPEC.md` — 데모 평가표 기반 구현 명세 (총 300점, 단계별 수락 기준)
- **DB 스키마는 별도 파일이 없다. 아래 [스키마 파악] 지침대로 실제 Oracle DB를 직접 조회해서 따른다.**

---

## 기술 스택 (확정 — 변경 금지)

- **프레임워크**: Next.js (App Router) + React + TypeScript
- **DB**: Oracle 21c XE (Docker, Colima로 구동) — **이미 구축되어 테이블/데이터가 들어 있음.**
- **DB 드라이버**: `oracledb` (node-oracledb) — **Thin 모드 사용** (Instant Client 설치 불필요, `initOracleClient()` 호출 금지)
- **쿼리 방식**: **raw SQL 직접 실행. ORM(Prisma/TypeORM 등) 절대 사용 금지.**
  - 데모에서 "이 화면이 어떤 SQL로 동작하는지" 설명할 수 있어야 하기 때문.
- **스타일**: Tailwind CSS + **shadcn/ui**
- **한글 폰트**: **Pretendard**

---

## 스키마 파악 (파일 없이 DB 직접 조회)

스키마 파일(schema.sql)이 없으므로, **실제 접속된 Oracle DB의 데이터 딕셔너리를 조회해서** 현재 테이블 구조(컬럼·타입·제약·PK/FK)를 파악하고 그대로 따른다.

참고 조회 (구현 전 1회 실행 권장):
```sql
-- 프로젝트 테이블의 컬럼 구조
SELECT table_name, column_name, data_type, data_length, nullable, data_default
FROM user_tab_columns
WHERE table_name IN ('CUSTOMER','ITEM','PURCHASEREQ','CHATROOM','MESSAGE')
ORDER BY table_name, column_id;

-- 제약(PK/FK/CHECK/UNIQUE)
SELECT table_name, constraint_name, constraint_type, search_condition
FROM user_constraints
WHERE table_name IN ('CUSTOMER','ITEM','PURCHASEREQ','CHATROOM','MESSAGE');
```

---

## 프로젝트 테이블 (이것만 사용 — 매우 중요)

이 계정에는 다른 수업/실습 테이블이 섞여 있다. **아래 5개만 프로젝트 테이블이다.**

- **CUSTOMER** — 회원 (관리자 = `cno='c0'`)
- **ITEM** — 상품
- **PURCHASEREQ** — 구매 요청
- **CHATROOM** — 채팅방
- **MESSAGE** — 메시지

**다음 테이블은 프로젝트와 무관하므로 절대 읽거나 건드리지 말 것 (무시):**
`DEPT`, `EMP`, `NEW_DEPT`, `PLAYER`, `SCHEDULE`, `STADIUM`, `TEAM`

---

## 절대 규칙 (CRITICAL)

1. **ORM 금지.** 모든 DB 접근은 `oracledb` 로 직접 SQL을 실행한다.
2. **DB 접근은 서버 전용.** node-oracledb는 네이티브 모듈이라 클라이언트 컴포넌트에서 호출 불가.
   → 모든 쿼리는 Route Handler(`app/api/.../route.ts`) 또는 Server Action에서만 실행한다.
3. **위 5개 프로젝트 테이블만 사용**하고, 무시 목록의 테이블은 조회·수정하지 않는다.
4. **스키마를 임의로 바꾸지 말 것.** 컬럼명·상태 값·제약은 실제 DB 구조를 따른다.
   - 상태 값은 정확히 `'판매 중'`, `'예약 중'`, `'거래 완료'`.
   - `Message.sender` 는 `'S'`(판매자)/`'B'`(구매자), `isRead` 는 `'Y'`/`'N'`.
5. **사진은 Oracle `BLOB`(pic1~3).** node-oracledb의 Lob 처리 방식으로 저장/조회한다.
6. **모든 UI 텍스트는 한국어.**
7. **DB 커넥션은 풀(pool)로 관리.** 매 요청마다 connect/close 반복하지 말 것.
8. **바인드 변수(`:var`)로 파라미터 처리.** 문자열 직접 연결 금지(SQL 인젝션 방지).
9. 작업은 **SPEC.md의 단계 순서대로** 진행하고, 각 단계가 끝나면 멈춰서 확인받는다.
10. **각 단계 구현이 끝날 때마다 git commit + push** 한다. (아래 [Git 워크플로우] 참조) **`.env.local`은 절대 커밋하지 않는다.**

---

## DB 연결

`.env.local` (값은 SQL Developer 접속 정보와 동일):

```
DB_USER=d202202603
DB_PASSWORD=<비밀번호>
DB_CONNECT_STRING=(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))(CONNECT_DATA=(SID=xe)))
```

- **SQL Developer가 SID=`xe`로 접속 중**이므로 connectString은 위 디스크립터 형식을 쓴다.
  (node-oracledb는 SID를 `host:port/xe`나 `host:port:xe` 형식으로 받지 못함. SID는 반드시 CONNECT_DATA=(SID=...) 디스크립터로 지정.)
- 만약 위로 접속이 안 되면 서비스명 방식 `localhost:1521/XE` 도 시도해볼 것.
- node-oracledb **Thin 모드**(기본). `initOracleClient()` 호출하지 말 것.
- 시작 시 커넥션 풀을 한 번 생성하고 재사용한다.

---

## 핵심 비즈니스 로직 (자세한 기준은 SPEC.md)

- **승인 시**: 해당 요청 승인 → `sellStatus='예약 중'`, `resDateTime`=현재시각, **나머지 요청자(들) 자동 삭제.**
- **48시간 초과**: '예약 중' & `resDateTime` 이 48h 초과 → `sellStatus='판매 중'` 복귀 + 그 예약(요청) 삭제. (화면 진입/새로고침 시 점검)
  - Oracle 조건 예: `WHERE sellStatus='예약 중' AND resDateTime < SYSTIMESTAMP - INTERVAL '48' HOUR`
- **거래 완료**: `sellStatus='거래 완료'` + `finalPrice` 저장.
- **통계(관리자)**: 그룹 함수 통계(예: 카테고리별 거래 건수, `GROUP BY ... ROLLUP`) + 윈도우 함수 통계(예: 회원별 거래액 순위, `RANK() OVER (...)`). DB에 이미 작성해둔 질의가 있으면 참고하고, 없으면 SPEC 기준으로 새로 작성.

---

## 화면 / 기능 (SPEC 단계 매핑)

1. 로그인 — 회원번호+비밀번호. 로그인 전/후 구분. 관리자 vs 일반 회원 권한 분리.
2. 물품 등록 — 제목·설명·카테고리·가격·거래장소 입력 + 사진 최대 3장.
3. 물품 목록 / 상세 검색 — 단일 조건 검색 + **AND/OR/NOT 복합 검색** + 정렬(최신순/가격순).
4. 물품 상세 — 사진/정보 표시 + 구매 요청(금액+메시지).
5. 받은 구매 요청 목록 (판매자) — 여러 요청자 표시 + 승인.
6. 1:1 채팅 — 방 목록(안 읽은 개수 배지) + 채팅방(읽음 여부) + 방 중복 방지.
7. 거래 완료 처리 — 최종 금액 입력.
8. 관리자 통계 — GROUP BY 통계 + 윈도우 함수 통계.

---

## 디자인 언어 (구식 와이어프레임 금지)

> TP-6 설계서는 각 화면의 **기능·항목**을 정의한 참고용일 뿐이다.
> 네모난 와이어프레임 스타일은 따르지 말고, 아래 디자인 시스템으로 **현대적인 모바일 앱**처럼 만든다.
> 참고 타깃: **당근마켓** 같은 깔끔한 카드형 UI, **토스** 같은 단정한 입력 폼.

- **먼저 공통 디자인 시스템부터.** 화면을 바로 만들지 말고, 재사용 컴포넌트(Button, Card, Input, Select, Badge, Dialog, EmptyState 등)를 shadcn/ui 기반으로 먼저 만들고 모든 화면을 그것으로 조립한다.
- **레이아웃**: 카드 기반, 넉넉한 여백, 정보 위계가 한눈에.
- **모서리/그림자**: `rounded-2xl` 수준 둥근 모서리, 부드러운 그림자(`shadow-sm`), 얇고 연한 테두리.
- **색**: 절제된 중립 톤 + 포인트 컬러 하나 = **당근 오렌지**(accent).
- **폰트**: **Pretendard** 적용.
- **상태 배지**: `'판매 중'`=초록, `'예약 중'`=노랑/주황, `'거래 완료'`=회색.
- **인터랙션**: hover/클릭에 미묘한 트랜지션. 과한 애니메이션 금지.
- **반응형**: 모바일 우선.
- **목록**: 표/카드로 깔끔하게. **검색·정렬은 버튼/드롭다운으로 선택.** (UI 편의성 20점 기준)

핵심: 화려함보다 **깔끔함·일관성·명확함**. 예쁘면서도 설명 없이 쓸 수 있어야 점수를 받는다.

---

## 시연용 Seed 데이터 (필수)

데모 시나리오대로 진행할 수 있도록 미리 준비한다. (기존 DB에 이미 일부 데이터가 있을 수 있으니 확인 후 보강)

- 회원: **판매자 A, 구매자 B, 구매자 C, 관리자 `c0`** + 통계가 의미 있을 만큼 추가 회원 몇 명.
- 물품: 카테고리·가격·상태가 다양하게 여러 개. 사진 포함 물품 최소 1개.
- 구매 요청: 한 물품에 B, C가 각각 요청한 케이스 포함.
- 채팅: 메시지 여러 건 + 안 읽은 메시지 있는 방 포함.
- 거래 완료 + finalPrice 들어간 물품 몇 개 (통계용).
- '예약 중' 물품 1개 (48시간 자동취소 시연용).

---

## 코딩 규칙 (보고서 평가 반영)

> TP-7 보고서가 **소스 코드 가독성·주석**을 평가한다(50점). 코드는 처음부터 깔끔하게.

- 각 모듈/함수에 **무엇을·왜** 하는지 한국어 주석을 충분히 단다.
- SQL은 별도로 모아 관리하고(예: `lib/db/queries.ts`), 어떤 화면이 어떤 질의를 쓰는지 추적 가능하게 한다.
- 폴더 구조: `app/`(라우트), `components/`(UI), `lib/`(DB·유틸).
- 매직 넘버 금지(48시간 등은 상수로).
- 예외는 try/catch로 잡아 **사용자에게는 안내 메시지**, 콘솔에는 원인 로그.

---

## Git 워크플로우

- **SPEC.md의 각 단계 구현이 끝날 때마다 commit 후 push** 한다. (한 단계 = 최소 한 커밋)
- 커밋 메시지는 한 일을 명확하게. 예:
  - `chore: 프로젝트 초기 설정 + 공통 디자인 시스템`
  - `feat: 단계 1 로그인 & 권한 구분`
  - `feat: 단계 3 물품 검색 (AND/OR/NOT + 정렬)`
  - `feat: 단계 6 거래 승인 → 예약 중 (나머지 요청 자동 삭제)`
- **`.env.local`은 절대 커밋하지 않는다.** DB 비밀번호가 들어 있으므로 반드시 `.gitignore`에 포함. (Next.js 기본 `.gitignore`가 `.env*.local`을 제외하지만, **첫 커밋 전에 직접 확인**할 것.)
- `node_modules/`, `.next/` 등 빌드 산출물도 커밋하지 않는다 (기본 .gitignore로 처리됨).
- 작업 시작 시 원격(origin)이 연결돼 있는지 확인하고, 없으면 사용자에게 알린다.
- 원격: `https://github.com/syujin2323/db-termproject-market.git`

---

## 실행 방법 (작성 후 갱신)

```bash
# 1) Oracle 구동 (이미 사용 중)
colima start
docker start <oracle21c 컨테이너명>

# 2) 의존성 & 개발 서버
npm install
npm run dev   # http://localhost:3000
```
