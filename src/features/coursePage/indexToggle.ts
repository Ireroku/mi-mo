// コースインデックスの一括開閉を、1つのトグルボタンにまとめる。
// 標準のドロップダウンを隠し、Svelte コンポーネントを差し込む。

import { mount, unmount } from "svelte";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import { isCoursePage } from "@/moodle/page";
import { applyStyleSheet } from "@/utils/styleSheet";
import IndexToggle from "./IndexToggle.svelte";

export type IndexState = "allExpanded" | "allCollapsed" | "mixed";

const STYLE_ID = "mimo-course-page-index-toggle";
// 右端は一覧の項目の右端へ、ブラウザが描いた位置で合わせる。縦はヘッダ（flex）の中央。
// 対応しないブラウザでは @supports の中が無視され、ヘッダの右端に並ぶ。
// スクロールバーの場所を常に空け、開閉で一覧の幅（と項目の右端）が変わらないようにする
const STYLE_CSS = `
body.pagelayout-course #courseindexdrawercontrolsmenubutton {
  display: none !important;
}
#theme_boost-drawers-courseindex .drawercontent {
  scrollbar-gutter: stable;
}
@supports (anchor-name: --a) {
  #course-index .courseindex-section-title {
    anchor-name: --mimo-index-item;
  }
  mimo-index-toggle {
    position: absolute;
    align-self: center;
    right: anchor(--mimo-index-item right);
  }
}
`;

export function readIndexState(): IndexState | undefined {
  const sections = document.querySelectorAll(
    '#course-index [data-for="section"]',
  );
  if (sections.length === 0) {
    return undefined;
  }

  const collapsedCount = document.querySelectorAll(
    '#course-index [data-for="section"][aria-expanded="false"]',
  ).length;
  if (collapsedCount === 0) {
    return "allExpanded";
  }
  if (collapsedCount === sections.length) {
    return "allCollapsed";
  }

  return "mixed";
}

export function toggleIndex(state: IndexState): void {
  const action =
    state === "allCollapsed"
      ? "expandallcourseindexsections"
      : "collapseallcourseindexsections";
  const target = document.querySelector<HTMLElement>(`[data-action="${action}"]`);
  target?.click();
}

export async function initIndexToggle(ctx: ContentScriptContext): Promise<void> {
  if (!isCoursePage()) {
    return;
  }

  const anchor = document.getElementById("courseindexdrawercontrolsmenubutton");
  if (!anchor) {
    return;
  }

  applyStyleSheet(STYLE_ID, STYLE_CSS);

  let componentInstance: { setState?: (next: IndexState) => void } | undefined;
  const ui = await createShadowRootUi(ctx, {
    name: "mimo-index-toggle",
    position: "inline",
    // ヘッダの直下に置き、位置の基準をドロワーにする。.dropdown の中は position: relative のため、
    // そこに置くと一覧の項目をアンカーとして参照できない
    anchor: "#theme_boost-drawers-courseindex .drawerheader",
    append: "last",
    // WXT の既定は :host へ all: initial !important を当て、外から書いた位置の指定を打ち消す
    inheritStyles: true,
    onMount: (container) => {
      const instance = mount(IndexToggle, {
        target: container,
        props: {
          state: readIndexState() ?? "allExpanded",
          onToggle: () => {
            const observedState = readIndexState();
            if (observedState) {
              toggleIndex(observedState);
            }
          },
        },
      });
      componentInstance = instance;
      return instance;
    },
    onRemove: (mounted) => {
      componentInstance = undefined;
      if (mounted) {
        unmount(mounted);
      }
    },
  });
  ui.mount();

  const courseIndex = document.getElementById("course-index");
  if (courseIndex) {
    const observer = new MutationObserver(() => {
      const next = readIndexState();
      if (next) {
        componentInstance?.setState?.(next);
      }
    });

    observer.observe(courseIndex, {
      attributes: true,
      attributeFilter: ["aria-expanded"],
      subtree: true,
    });
    ctx.onInvalidated(() => observer.disconnect());
  }
}
