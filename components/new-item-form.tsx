"use client";

// 단계 2 — 물품 등록 폼. 제목·설명·카테고리·가격·거래장소 + 사진 최대 3장.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";

const MAX_PHOTOS = 3;

export function NewItemForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    tradePlace: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 선택한 파일의 미리보기 URL 생성/정리
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
    if (fileRef.current) fileRef.current.value = ""; // 같은 파일 재선택 허용
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.category ||
      !form.price.trim() ||
      !form.tradePlace.trim()
    ) {
      setError("제목·설명·카테고리·가격·거래 장소를 모두 입력해 주세요.");
      return;
    }

    const fd = new FormData();
    fd.set("title", form.title.trim());
    fd.set("description", form.description.trim());
    fd.set("category", form.category);
    fd.set("price", form.price.replace(/[^0-9]/g, ""));
    fd.set("tradePlace", form.tradePlace.trim());
    files.forEach((f) => fd.append("photos", f));

    setLoading(true);
    try {
      const res = await fetch("/api/items", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "물품 등록에 실패했습니다.");
        return;
      }
      toast.success("물품이 등록되었습니다.");
      router.push(`/items/${data.cno}/${data.itemNo}`);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-2">
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {/* 사진 업로더 */}
          <div className="grid gap-2">
            <Label>
              사진{" "}
              <span className="text-muted-foreground">
                ({files.length}/{MAX_PHOTOS})
              </span>
            </Label>
            <div className="flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div
                  key={src}
                  className="relative size-24 overflow-hidden rounded-xl border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`미리보기 ${i + 1}`} className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
                    aria-label="사진 삭제"
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              ))}
              {files.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex size-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-muted-foreground transition-colors hover:bg-muted"
                >
                  <ImagePlusIcon className="size-5" />
                  <span className="text-xs">추가</span>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={onPickFiles}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="예: 아이폰 14 Pro 256GB"
              maxLength={100}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">카테고리</Label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className={cn(
                "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                form.category ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <option value="" disabled>
                카테고리를 선택하세요
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="text-foreground">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="price">가격 (원)</Label>
            <Input
              id="price"
              inputMode="numeric"
              value={form.price}
              onChange={(e) => set("price", e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="예: 1100000"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tradePlace">거래 희망 장소</Label>
            <Input
              id="tradePlace"
              value={form.tradePlace}
              onChange={(e) => set("tradePlace", e.target.value)}
              placeholder="예: 강남역 2번 출구"
              maxLength={200}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="물품 상태, 구입 시기 등을 적어주세요."
              rows={5}
              maxLength={300}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "등록 중…" : "등록하기"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
