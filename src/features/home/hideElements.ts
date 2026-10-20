// サイトホーム（/）のお知らせ・コースカテゴリ・コース検索を隠す。
// DOM を走査せず、対象のセレクタだけを集めた <style> を1つ注入する。

import { applyStyleSheet } from "@/utils/styleSheet";

export interface HideElementsConfig {
  announcements: boolean;
  categories: boolean;
  search: boolean;
}

const SELECTORS: Record<keyof HideElementsConfig, string> = {
  announcements: "body.pagelayout-frontpage div.course-content",
  categories: "body.pagelayout-frontpage #frontpage-category-names",
  search: "body.pagelayout-frontpage #region-main div.simplesearchform",
};

const STYLE_ELEMENT_ID = "mimo-home-hide-style";

export function applyHideElements(config: HideElementsConfig): void {
  const selectors = (Object.keys(SELECTORS) as (keyof HideElementsConfig)[])
    .filter((key) => config[key])
    .map((key) => SELECTORS[key]);
  const css = selectors.length > 0
    ? `${selectors.join(",")} { display: none !important; }`
    : "";
  applyStyleSheet(STYLE_ELEMENT_ID, css);
}
