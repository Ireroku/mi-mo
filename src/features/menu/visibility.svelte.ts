import type { Attachment } from "svelte/attachments";
import { SvelteMap } from "svelte/reactivity";

// この割合以上が見えていれば、すべて見えているとみなす。1 ちょうどにしないのは、端数の丸めで 0.999 になることがあるため
const VISIBLE_RATIO = 0.99;

/**
 * メニューに置いた要素のうち、隠れているものを鍵ごとに控える。
 * display:none の要素と、overflow で切られた要素を IntersectionObserver で見つける。一部だけ切れた要素も隠れているとみなす。
 * 幅は測らない。控えは $state と同じく反応するため、ドロワーのブロックはこれを読むだけで追随する。
 */
export class HiddenTracker<K> {
  #hidden = new SvelteMap<Element, K>();
  #keys = new Map<Element, K>();
  // 根はビューポートにする。上部メニューは画面上端に固定されているため、スクロールで見えなくなることが無い
  #observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const key = this.#keys.get(entry.target);
        if (key === undefined) {
          continue;
        }
        if (entry.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO) {
          this.#hidden.delete(entry.target);
        } else {
          this.#hidden.set(entry.target, key);
        }
      }
    },
    { threshold: VISIBLE_RATIO },
  );

  /**
   * 要素を見張る attachment を返す。要素が取り除かれると、見張りと控えを外す。
   * コンポーネントへ関数のまま渡せるよう、this を束縛したアロー関数にする。
   */
  watch = (key: K): Attachment => {
    return (element) => {
      this.#keys.set(element, key);
      this.#observer.observe(element);
      return () => {
        this.#observer.unobserve(element);
        this.#keys.delete(element);
        this.#hidden.delete(element);
      };
    };
  };

  /** 隠れている要素の鍵。同じ鍵の要素が複数あっても1つにまとめる */
  get hiddenKeys(): Set<K> {
    return new Set(this.#hidden.values());
  }

  disconnect(): void {
    this.#observer.disconnect();
  }
}
