// マイコース一覧のコース1件について、要素内のどこをクリックしてもコースページへ移動できるようにする。

import { applyStyleSheet } from "@/utils/styleSheet";

const STYLE_ELEMENT_ID = "mimo-my-courses-clickable-card";

export function applyClickableCard(): void {
  const css = `
body.pagelayout-mycourses [data-region="course-content"] {
  position: relative;
}

body.pagelayout-mycourses [data-region="course-content"] a.coursename::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
}

body.pagelayout-mycourses [data-region="course-content"] .menu {
  position: relative;
  z-index: 2;
}
`;

  applyStyleSheet(STYLE_ELEMENT_ID, css);
}
