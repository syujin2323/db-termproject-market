// 물품 등록 페이지 (로그인 필수).
import { requireUser } from "@/lib/auth";
import { NewItemForm } from "@/components/new-item-form";

export default async function NewItemPage() {
  await requireUser(); // 비로그인 시 /login 으로

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">물품 등록</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        판매할 물품의 정보와 사진을 등록하세요.
      </p>
      <NewItemForm />
    </div>
  );
}
