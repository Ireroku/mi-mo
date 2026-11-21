// 拡張機能の設定の写しを、ページの localStorage へ置く。
// storage.local は非同期でしか読めず、最初の描画に間に合わないことがあるため、
// 同期で読める写しを描画前の判断に使う。正本は storage.local のままにする。

interface PageCacheEntry<T> {
  version: string;
  value: T;
}

/**
 * localStorage から読んだ文字列を写しとして解釈する。
 * 版が違うもの、形の読めないものは undefined を返す。
 */
export function parsePageCache<T>(raw: string | null, version: string): T | undefined {
  if (raw === null) {
    return undefined;
  }

  try {
    const entry = JSON.parse(raw) as Partial<PageCacheEntry<T>> | null;
    if (entry?.version !== version || entry.value === undefined) {
      return undefined;
    }
    return entry.value;
  } catch {
    return undefined;
  }
}

/**
 * 写しを同期で読む。無い時と読めない時は undefined を返す。
 */
export function readPageCache<T>(key: string, version: string): T | undefined {
  try {
    return parsePageCache<T>(localStorage.getItem(key), version);
  } catch {
    // Cookie を拒否する設定では localStorage に触れるだけで例外になる
    return undefined;
  }
}

/**
 * 写しを書き込む。中身が同じなら書かない。書けない時は黙って諦める。
 */
export function writePageCache<T>(key: string, version: string, value: T): void {
  const raw = JSON.stringify({ version, value } satisfies PageCacheEntry<T>);
  try {
    if (localStorage.getItem(key) !== raw) {
      localStorage.setItem(key, raw);
    }
  } catch {
    // 容量の超過と、localStorage を使えない設定。写しが無くても正本で動く
  }
}
