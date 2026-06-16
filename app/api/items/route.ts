// 물품 등록 API (단계 2). multipart/form-data 로 입력 + 사진 최대 3장(BLOB).
import { NextRequest, NextResponse } from "next/server";
import oracledb from "oracledb";
import { withTransaction } from "@/lib/db";
import { ITEM_SQL } from "@/lib/queries";
import { getSessionCno } from "@/lib/session";
import { SELL_STATUS, CATEGORIES } from "@/lib/constants";

const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 한 장당 5MB

/** Buffer(또는 null)를 BLOB IN 바인드로 변환 */
function blobBind(buf: Buffer | null) {
  return { val: buf, type: oracledb.BLOB, dir: oracledb.BIND_IN };
}

export async function POST(req: NextRequest) {
  try {
    const cno = await getSessionCno();
    if (!cno) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const form = await req.formData();
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const category = String(form.get("category") ?? "").trim();
    const priceRaw = String(form.get("price") ?? "").trim();
    const tradePlace = String(form.get("tradePlace") ?? "").trim();

    // 필수 항목 검증 → 안내 메시지 (전반 평가: 필수 항목 비우고 등록)
    if (!title || !description || !category || !priceRaw || !tradePlace) {
      return NextResponse.json(
        { error: "제목·설명·카테고리·가격·거래 장소를 모두 입력해 주세요." },
        { status: 400 }
      );
    }
    if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
      return NextResponse.json({ error: "카테고리를 선택해 주세요." }, { status: 400 });
    }
    const price = Number(priceRaw.replace(/,/g, ""));
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: "가격은 0보다 큰 숫자로 입력해 주세요." },
        { status: 400 }
      );
    }
    if (title.length > 100 || description.length > 300 || tradePlace.length > 200) {
      return NextResponse.json(
        { error: "입력 길이가 허용 범위를 초과했습니다." },
        { status: 400 }
      );
    }

    // 사진 처리 (최대 3장, 이미지 파일만, 장당 5MB 이하)
    const files = form
      .getAll("photos")
      .filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > MAX_PHOTOS) {
      return NextResponse.json({ error: "사진은 최대 3장까지 등록할 수 있습니다." }, { status: 400 });
    }
    const buffers: (Buffer | null)[] = [null, null, null];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f.type.startsWith("image/")) {
        return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 400 });
      }
      if (f.size > MAX_PHOTO_BYTES) {
        return NextResponse.json(
          { error: "사진 한 장당 5MB 이하만 업로드할 수 있습니다." },
          { status: 400 }
        );
      }
      buffers[i] = Buffer.from(await f.arrayBuffer());
    }

    // 채번 + INSERT 를 한 트랜잭션으로 (동시 등록 시 itemNo 충돌 방지)
    const itemNo = await withTransaction(async (conn) => {
      const r = await conn.execute<{ next: number }>(ITEM_SQL.nextItemNo, { cno });
      const next = r.rows![0].next;
      await conn.execute(ITEM_SQL.insert, {
        cno,
        itemNo: next,
        title,
        description,
        category,
        price,
        tradePlace,
        sellStatus: SELL_STATUS.ON_SALE,
        pic1: blobBind(buffers[0]),
        pic2: blobBind(buffers[1]),
        pic3: blobBind(buffers[2]),
      });
      return next;
    });

    return NextResponse.json({ cno, itemNo }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/items]", e);
    return NextResponse.json(
      { error: "물품 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
