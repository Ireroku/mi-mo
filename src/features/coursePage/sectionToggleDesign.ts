// コース内容の右上にある「すべてを展開する / すべてを折りたたむ」のリンクを、押せると分かる見た目へ整える。

import { applyStyleSheet } from "@/utils/styleSheet";

const STYLE_ELEMENT_ID = "mimo-course-page-section-toggle";

export function applySectionToggleDesign(): void {
  const css = `
body.pagelayout-course #collapsesections {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--secondary, #ced4da);
  border-radius: 0.375rem;
  color: var(--primary, #0f6cbf);
  font-size: 0.875rem;
  text-decoration: none;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

body.pagelayout-course #collapsesections:hover {
  background-color: rgba(15, 108, 191, 0.08);
  background-color: color-mix(in srgb, var(--primary, #0f6cbf) 8%, transparent);
  border-color: var(--primary, #0f6cbf);
  text-decoration: none;
}

body.pagelayout-course #collapsesections:focus-visible {
  outline: 2px solid var(--primary, #0f6cbf);
  outline-offset: 2px;
}
`;

  applyStyleSheet(STYLE_ELEMENT_ID, css);
}
