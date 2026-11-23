// コースセクションのヘッダーの右端へ、操作のボタンを並べる。
// 書き出しと資料の一括保存が、同じ置き場所と同じ見た目を共有する。
// ページ資料の画面では、「完了マークする」の帯の右端を同じように使う。

import { applyStyleSheet } from "@/utils/styleSheet";

const STYLE_ID = "mimo-course-page-section-actions";
const CONTAINER_CLASS = "mimo-section-actions";

// sectionToggleDesign は、このクラスと Moodle の「すべてを折りたたむ」のリンクへ同じ見た目を当てる。
// Moodle のクラス（section-collapsemenu）を借りると、Moodle のスクリプトが拾うおそれがあるため、自前のクラスを付ける
export const SECTION_ACTION_CLASS = "mimo-section-action";
const BUTTON_CLASS = `btn btn-link btn-sm text-nowrap ${SECTION_ACTION_CLASS}`;

const CONTAINER_CSS = `
/* ページ資料の画面の帯は横並びにして、完了の情報を左に残す */
body.path-mod-page .activity-header:has(> .${CONTAINER_CLASS}) {
  display: flex;
  align-items: center;
}
/* Moodle は帯の最後の要素の中の下線を消す。置き場所が最後に来るため、その1つ前で同じように消す */
body.path-mod-page .activity-header > div:has(+ .${CONTAINER_CLASS}) > div:last-child {
  border-bottom: 0;
}
/* 狭い画面では、タイトルを潰さずに置き場所ごと次の行へ回す */
body.pagelayout-course .course-section-header:has(> .${CONTAINER_CLASS}) {
  flex-wrap: wrap;
  row-gap: 0.5rem;
}
body:is(.pagelayout-course, .path-mod-page) :is(.course-section-header, .activity-header) > .${CONTAINER_CLASS} {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  min-width: 0;
  align-items: center;
  align-self: center;
  gap: 0.5rem;
  margin-left: auto;
}
/* 「すべてを折りたたむ」のある見出しでは、Moodle がそのボタンを上寄せと 0.5rem の余白で置くため、同じ位置へ揃える */
body.pagelayout-course .course-section-header:has(> * > .section-collapsemenu) > .${CONTAINER_CLASS} {
  align-self: flex-start;
  margin-top: 0.5rem;
}
`;

/**
 * ヘッダーの右端の置き場所へボタンを1つ足す。marker のクラスを持つボタンが既にあれば何もせず undefined を返す。
 */
export function addSectionAction(
  header: Element,
  marker: string,
  label: string,
): HTMLButtonElement | undefined {
  if (header.querySelector(`.${marker}`)) {
    return undefined;
  }

  applyStyleSheet(STYLE_ID, CONTAINER_CSS);

  let container = header.querySelector(`:scope > .${CONTAINER_CLASS}`);
  if (!container) {
    container = document.createElement("div");
    container.className = CONTAINER_CLASS;
    header.appendChild(container);
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = `${BUTTON_CLASS} ${marker}`;
  button.textContent = label;
  container.appendChild(button);
  return button;
}
