"use client";

// 단계 3 — 물품 목록 + 검색. 단일 조건 + AND/OR/NOT 복합 조건 + 정렬.
import { useState, type FormEvent } from "react";
import { SearchIcon, PlusIcon, XIcon, SlidersHorizontalIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ItemCard } from "@/components/item-card";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import type { Connector, SearchField, SortKey } from "@/lib/search";
import type { Item } from "@/lib/types";

const FIELD_LABEL: Record<SearchField, string> = {
  title: "제목",
  description: "설명",
  category: "카테고리",
  minPrice: "최소가격",
  maxPrice: "최대가격",
};
const CONNECTOR_LABEL: Record<Connector, string> = {
  AND: "그리고 (AND)",
  OR: "또는 (OR)",
  NOT: "제외 (NOT)",
};
const SORT_LABEL: Record<SortKey, string> = {
  latest: "최신순",
  price_asc: "가격 낮은순",
  price_desc: "가격 높은순",
};

const selectCls =
  "h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface Row {
  connector: Connector;
  field: SearchField;
  value: string;
}

export function ItemBrowser({ initialItems }: { initialItems: Item[] }) {
  const [rows, setRows] = useState<Row[]>([
    { connector: "AND", field: "title", value: "" },
  ]);
  const [sort, setSort] = useState<SortKey>("latest");
  const [items, setItems] = useState<Item[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, { connector: "AND", field: "title", value: "" }]);
    setAdvanced(true);
  }
  function removeRow(i: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function runSearch(e?: FormEvent, sortOverride?: SortKey) {
    e?.preventDefault();
    const sortToUse = sortOverride ?? sort;

    // 가격 범위 검증: 최대가격 < 최소가격이면 경고하고 검색 차단 (TP-6 방법 B)
    const minRow = rows.find((r) => r.field === "minPrice" && r.value.trim() !== "");
    const maxRow = rows.find((r) => r.field === "maxPrice" && r.value.trim() !== "");
    if (minRow && maxRow && Number(maxRow.value) < Number(minRow.value)) {
      setError("최대 가격은 최소 가격보다 크거나 같아야 합니다.");
      return;
    }
    setError(null);

    const conditions = rows
      .filter((r) => r.value.trim() !== "")
      .map((r, i) => (i === 0 ? { field: r.field, value: r.value } : r));

    setLoading(true);
    try {
      const qs = new URLSearchParams({
        conditions: JSON.stringify(conditions),
        sort: sortToUse,
      });
      const res = await fetch(`/api/items?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "검색 중 오류가 발생했습니다.");
        return;
      }
      setItems(data.items);
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setRows([{ connector: "AND", field: "title", value: "" }]);
    setSort("latest");
    setItems(initialItems);
    setAdvanced(false);
    setError(null);
  }

  return (
    <div>
      {/* 검색 패널 */}
      <Card className="mb-5">
        <CardContent>
          <form onSubmit={(e) => runSearch(e)} className="flex flex-col gap-3">
            {rows.map((row, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                {/* 연결 연산자 (두 번째 조건부터) */}
                {i === 0 ? (
                  <span className="w-20 shrink-0 text-sm font-medium text-muted-foreground">
                    조건
                  </span>
                ) : (
                  <select
                    aria-label="연결 연산자"
                    className={cn(selectCls, "w-28 shrink-0")}
                    value={row.connector}
                    onChange={(e) =>
                      updateRow(i, { connector: e.target.value as Connector })
                    }
                  >
                    {(Object.keys(CONNECTOR_LABEL) as Connector[]).map((c) => (
                      <option key={c} value={c}>
                        {CONNECTOR_LABEL[c]}
                      </option>
                    ))}
                  </select>
                )}

                {/* 검색 필드 */}
                <select
                  aria-label="검색 항목"
                  className={cn(selectCls, "w-28 shrink-0")}
                  value={row.field}
                  onChange={(e) =>
                    updateRow(i, { field: e.target.value as SearchField, value: "" })
                  }
                >
                  {(Object.keys(FIELD_LABEL) as SearchField[]).map((f) => (
                    <option key={f} value={f}>
                      {FIELD_LABEL[f]}
                    </option>
                  ))}
                </select>

                {/* 값 입력 (필드에 따라 달라짐) */}
                {row.field === "category" ? (
                  <select
                    aria-label="카테고리"
                    className={cn(selectCls, "min-w-40 flex-1")}
                    value={row.value}
                    onChange={(e) => updateRow(i, { value: e.target.value })}
                  >
                    <option value="">카테고리 선택</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : row.field === "minPrice" || row.field === "maxPrice" ? (
                  <Input
                    className="min-w-40 flex-1"
                    inputMode="numeric"
                    placeholder={row.field === "minPrice" ? "최소 금액" : "최대 금액"}
                    value={row.value}
                    onChange={(e) =>
                      updateRow(i, { value: e.target.value.replace(/[^0-9]/g, "") })
                    }
                  />
                ) : (
                  <Input
                    className="min-w-40 flex-1"
                    placeholder={`${FIELD_LABEL[row.field]} 검색어`}
                    value={row.value}
                    onChange={(e) => updateRow(i, { value: e.target.value })}
                  />
                )}

                {/* 행 삭제 */}
                {rows.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeRow(i)}
                    aria-label="조건 삭제"
                  >
                    <XIcon />
                  </Button>
                )}
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <PlusIcon /> 조건 추가
              </Button>
              {!advanced && rows.length === 1 && (
                <span className="text-xs text-muted-foreground">
                  <SlidersHorizontalIcon className="mr-1 inline size-3" />
                  조건을 추가하면 AND/OR/NOT 복합 검색이 가능합니다
                </span>
              )}

              {/* 정렬 */}
              <select
                aria-label="정렬"
                className={cn(selectCls, "ml-auto w-32")}
                value={sort}
                onChange={(e) => {
                  const next = e.target.value as SortKey;
                  setSort(next);
                  runSearch(undefined, next);
                }}
              >
                {(Object.keys(SORT_LABEL) as SortKey[]).map((s) => (
                  <option key={s} value={s}>
                    {SORT_LABEL[s]}
                  </option>
                ))}
              </select>

              <Button type="button" variant="ghost" size="sm" onClick={reset}>
                초기화
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                <SearchIcon /> {loading ? "검색 중…" : "검색"}
              </Button>
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* 결과 */}
      <p className="mb-3 text-sm text-muted-foreground">
        총 <b className="text-foreground">{items.length}</b>개
      </p>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
          조건에 맞는 물품이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ItemCard key={`${item.cno}-${item.itemNo}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
