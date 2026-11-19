// ページ上部のパンくずリストを、階層を追いやすい見た目へ整える。

import { applyStyleSheet } from "@/utils/styleSheet";

const STYLE_ELEMENT_ID = "mimo-ui-breadcrumb";

export function applyBreadcrumb(): void {
  const css = `
#page-header .breadcrumb {
  font-size: 0.9em;
  align-items: center;
}

#page-header .breadcrumb-item > a {
  color: var(--primary, #0f6cbf);
  text-decoration: none;
}

#page-header .breadcrumb-item > a:hover {
  text-decoration: underline;
}

#page-header .breadcrumb-item > span {
  font-weight: 600;
  color: inherit;
}
`;
  applyStyleSheet(STYLE_ELEMENT_ID, css);
}
