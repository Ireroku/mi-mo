// 上部メニューと左ドロワーに出る Moodle のロゴを隠す。
// PC 表示とモバイル表示で置かれている場所が違うため、両方を対象にする。

import { applyStyleSheet } from "@/utils/styleSheet";

export interface MenuLogoConfig {
  hidden: boolean;
}

const STYLE_ID = "mimo-menu-logo";

const CSS = `
nav.navbar a.navbar-brand,
.drawerheader img.logo {
  display: none !important;
}
`;

/**
 * 上部メニューと左ドロワーの Moodle ロゴを非表示にする。
 */
export function applyMenuLogo(config: MenuLogoConfig): void {
  applyStyleSheet(STYLE_ID, config.hidden ? CSS : "");
}
