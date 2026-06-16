// 물품 검색용 동적 WHERE/ORDER BY 조립기 (단계 3).
// RISS식 상세검색: 여러 조건을 AND/OR/NOT 으로 조합한다.
// 값은 전부 바인드 변수(:pN)로만 넣어 SQL 인젝션을 방지한다.

export type Connector = "AND" | "OR" | "NOT";
export type SearchField =
  | "title"
  | "description"
  | "category"
  | "minPrice"
  | "maxPrice";
export type SortKey = "latest" | "price_asc" | "price_desc";

export interface SearchCondition {
  connector?: Connector; // 두 번째 조건부터 의미 있음(첫 조건은 무시)
  field: SearchField;
  value: string;
}

// 필드별 술어(predicate). p 는 바인드 플레이스홀더(":p0" 등).
const FIELD_PREDICATE: Record<SearchField, (p: string) => string> = {
  title: (p) => `i.title LIKE '%' || ${p} || '%'`,
  description: (p) => `i.description LIKE '%' || ${p} || '%'`,
  category: (p) => `i.category = ${p}`,
  minPrice: (p) => `i.price >= ${p}`,
  maxPrice: (p) => `i.price <= ${p}`,
};

// 정렬 화이트리스트 (사용자 입력을 직접 ORDER BY에 넣지 않는다).
const ORDER_BY: Record<SortKey, string> = {
  latest: "i.regDateTime DESC",
  price_asc: "i.price ASC, i.regDateTime DESC",
  price_desc: "i.price DESC, i.regDateTime DESC",
};

const CONNECTORS: Connector[] = ["AND", "OR", "NOT"];
const FIELDS: SearchField[] = [
  "title",
  "description",
  "category",
  "minPrice",
  "maxPrice",
];
const SORT_KEYS: SortKey[] = ["latest", "price_asc", "price_desc"];

export interface BuiltSearch {
  where: string; // "WHERE ..." 또는 "" (조건 없음 → 전체)
  orderBy: string; // "ORDER BY ..."
  binds: Record<string, string | number>;
}

/**
 * 조건 배열과 정렬키로 WHERE/ORDER BY/binds 를 만든다.
 * - 값이 빈 조건은 건너뛴다.
 * - 첫 유효 조건은 기준이 되고, 이후 조건은 connector(AND/OR/NOT)로 이어 붙인다.
 *   · AND → " AND (술어)"   · OR → " OR (술어)"   · NOT → " AND NOT (술어)"
 */
export function buildItemSearch(
  rawConditions: unknown,
  sort: unknown
): BuiltSearch {
  const conditions = Array.isArray(rawConditions) ? rawConditions : [];
  const binds: Record<string, string | number> = {};
  const parts: { connector: Connector | null; sql: string }[] = [];

  let idx = 0;
  for (const c of conditions) {
    if (!c || typeof c !== "object") continue;
    const field = (c as SearchCondition).field;
    const value = String((c as SearchCondition).value ?? "").trim();
    if (!FIELDS.includes(field) || value === "") continue;

    const placeholder = `:p${idx}`;
    let bindValue: string | number = value;
    if (field === "minPrice" || field === "maxPrice") {
      const n = Number(value.replace(/,/g, ""));
      if (!Number.isFinite(n)) continue; // 숫자가 아니면 무시
      bindValue = n;
    }
    binds[`p${idx}`] = bindValue;

    const rawConn = (c as SearchCondition).connector;
    const connector: Connector | null =
      parts.length === 0
        ? null
        : CONNECTORS.includes(rawConn as Connector)
          ? (rawConn as Connector)
          : "AND";

    parts.push({ connector, sql: FIELD_PREDICATE[field](placeholder) });
    idx++;
  }

  let clause = "";
  parts.forEach((part, i) => {
    if (i === 0) {
      clause = `(${part.sql})`;
    } else if (part.connector === "OR") {
      clause += ` OR (${part.sql})`;
    } else if (part.connector === "NOT") {
      clause += ` AND NOT (${part.sql})`;
    } else {
      clause += ` AND (${part.sql})`;
    }
  });

  const sortKey: SortKey = SORT_KEYS.includes(sort as SortKey)
    ? (sort as SortKey)
    : "latest";

  return {
    where: clause ? `WHERE ${clause}` : "",
    orderBy: `ORDER BY ${ORDER_BY[sortKey]}`,
    binds,
  };
}
