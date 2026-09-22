// コースページのセクションタイトルに下線を付け、リンクであることを見た目で分かるようにする。

import { applyStyleSheet } from "@/utils/styleSheet";

const STYLE_ELEMENT_ID = "mimo-course-page-section-title-link";

export function applySectionTitleLink(): void {
  const css = `
body.pagelayout-course #region-main .sectionname > a {
  text-decoration: underline;
  text-underline-offset: 0.2em;
  text-decoration-thickness: 1px;
}

body.pagelayout-course #region-main .sectionname > a:hover {
  color: var(--primary, #0f6cbf);
}
`;

  applyStyleSheet(STYLE_ELEMENT_ID, css);
}
