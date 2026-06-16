// 물품 사진(BLOB) 서빙. /api/items/{cno}/{itemNo}/photo/{1|2|3}
import { query } from "@/lib/db";
import { ITEM_SQL } from "@/lib/queries";

const COLUMN: Record<string, "pic1" | "pic2" | "pic3"> = {
  "1": "pic1",
  "2": "pic2",
  "3": "pic3",
};

/** 매직 바이트로 이미지 MIME 추정 (스키마에 MIME 컬럼이 없으므로) */
function sniffMime(buf: Buffer): string {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return "image/jpeg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return "image/png";
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46)
    return "image/gif";
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return "application/octet-stream";
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cno: string; itemNo: string; n: string }> }
) {
  const { cno, itemNo, n } = await params;
  const col = COLUMN[n];
  if (!col) return new Response("Not Found", { status: 404 });

  const rows = await query<{ pic: Buffer | null }>(ITEM_SQL.photo(col), {
    cno,
    itemNo: Number(itemNo),
  });
  const pic = rows[0]?.pic;
  if (!pic || pic.length === 0) return new Response("No Image", { status: 404 });

  return new Response(new Uint8Array(pic), {
    headers: {
      "Content-Type": sniffMime(pic),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
