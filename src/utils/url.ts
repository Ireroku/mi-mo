// URL の文字列から、クエリの値やパスの末尾を読み取る。

// 相対 URL を解くための仮の起点。読み取るのはクエリとパスだけで、起点の値は結果に出ない。
const DUMMY_BASE = "https://dummy.example";

/**
 * URL のクエリの `id` を返す。URL として解けない場合や `id` が無い場合は null を返す。
 * 相対 URL も受け付ける。
 */
export function readIdParam(url: string): string | null {
  try {
    return new URL(url, DUMMY_BASE).searchParams.get("id");
  } catch {
    return null;
  }
}

/**
 * パスの最後の区切りより後ろを、デコードして返す。
 * デコードできない並びを含む場合は、デコードせずに返す。
 */
export function lastPathSegment(url: URL): string {
  const segment = url.pathname.split("/").pop() ?? "";
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
