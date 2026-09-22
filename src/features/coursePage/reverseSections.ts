// コースページのセクション一覧を画面上で逆順に表示する。
// 本文と左のコースインデックスの両方を反転させ、CSS の flex-direction だけで行う。

import { applyStyleSheet } from "@/utils/styleSheet";

export interface ReverseSectionsConfig {
  enabled: boolean;
}

const STYLE_ID = "mimo-course-page-reverse-sections";

const CSS = `
body.pagelayout-course #region-main div.course-content > div > ul[data-for="course_sectionlist"] {
  display: flex;
  flex-direction: column-reverse;
}

body.pagelayout-course #theme_boost-drawers-courseindex #course-index {
  display: flex;
  flex-direction: column-reverse;
}
`;

/**
 * コースページのセクション一覧およびコースインデックスを逆順に表示する。
 */
export function applyReverseSections(config: ReverseSectionsConfig): void {
  applyStyleSheet(STYLE_ID, config.enabled ? CSS : "");
}
