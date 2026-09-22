// 画面右下に重なって出るヒントボタンを隠す。
// 全ページに出る要素のため、ページ種別で絞らない。

import { applyStyleSheet } from "@/utils/styleSheet";

export interface FloatingHintConfig {
  hidden: boolean;
}

const STYLE_ID = "mimo-ui-floating-hint";

const CSS = `
#page-footer .btn-footer-popover {
  display: none !important;
}
`;

/**
 * 画面右下に重なって出るヒントボタンを隠す。
 */
export function applyFloatingHint(config: FloatingHintConfig): void {
  applyStyleSheet(STYLE_ID, config.hidden ? CSS : "");
}
