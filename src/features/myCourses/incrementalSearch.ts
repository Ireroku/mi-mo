// マイコースの検索欄を手元で即座に絞り込む形に置き換える。
// Moodle 標準のキー入力をキャプチャフェーズで止め、打鍵ごとに要素を隠す。

import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { isMyCourses } from "@/moodle/page";
import { applyStyleSheet } from "@/utils/styleSheet";

const STYLE_ID = "mimo-my-courses-incremental-search";

const CSS = `
body.pagelayout-mycourses [data-mimo-filtered] {
  display: none !important;
}

body.pagelayout-mycourses [data-mimo-search-empty] {
  padding: 1rem 0;
  text-align: center;
  color: var(--secondary, #6c757d);
}
`;

function filterCourses(searchTerm: string): void {
  const container = document.querySelector(".block-myoverview");
  if (!container) {
    return;
  }

  const items = container.querySelectorAll<HTMLElement>(
    '[data-region="course-content"]',
  );
  const query = searchTerm.trim().toLowerCase();
  let visibleCount = 0;
  for (const item of items) {
    if (!query) {
      item.removeAttribute("data-mimo-filtered");
      visibleCount++;
      continue;
    }

    const titleEl = item.querySelector(".coursename");
    const title = titleEl?.textContent?.trim().toLowerCase() ?? "";
    if (title.includes(query)) {
      item.removeAttribute("data-mimo-filtered");
      visibleCount++;
    } else {
      item.setAttribute("data-mimo-filtered", "true");
    }
  }

  let emptyMsg = container.querySelector<HTMLElement>("[data-mimo-search-empty]");
  if (query && visibleCount === 0) {
    if (!emptyMsg) {
      emptyMsg = document.createElement("div");
      emptyMsg.setAttribute("data-mimo-search-empty", "true");
      emptyMsg.textContent = "該当するコースがありません";
      container
        .querySelector('[data-region="courses-view"]')
        ?.appendChild(emptyMsg);
    }
  } else if (emptyMsg) {
    emptyMsg.remove();
  }
}

/**
 * マイコースのインクリメンタル検索を初期化する。
 */
export function initIncrementalSearch(ctx: ContentScriptContext): void {
  if (!isMyCourses()) {
    return;
  }

  applyStyleSheet(STYLE_ID, CSS);

  ctx.addEventListener(
    document,
    "keyup",
    (event) => {
      const target = event.target as HTMLElement | null;
      if (
        !target ||
        !target.matches('.block-myoverview [data-region="input"]')
      ) {
        return;
      }

      event.stopPropagation();

      const input = target as HTMLInputElement;
      filterCourses(input.value);
    },
    true, // キャプチャフェーズで登録して Moodle 本体の再描画を止める
  );

  const block = document.querySelector(".block-myoverview");
  if (block) {
    const observer = new MutationObserver(() => {
      const input = block.querySelector<HTMLInputElement>(
        '[data-region="input"]',
      );
      if (input) {
        filterCourses(input.value);
      }
    });

    observer.observe(block, { childList: true, subtree: true });
    ctx.onInvalidated(() => observer.disconnect());
  }
}
