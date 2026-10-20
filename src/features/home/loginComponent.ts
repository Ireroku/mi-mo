// 未ログインでサイトホームを開いた時に、ドロワーのログインフォームを本文の器へ移す。
// Moodle が出しているフォームをそのまま動かす。

import { isLoggedIn } from "@/moodle/user";
import { isSiteHome } from "@/moodle/page";
import { ensureHomeContainer } from "@/features/home/container";
import { applyStyleSheet } from "@/utils/styleSheet";

const STYLE_ID = "mimo-home-login-component";

const CSS = `
body.notloggedin #mimo-home-top .block_login {
  max-width: 28rem;
  margin: 0 auto 1.5rem;
}
`;

/**
 * 未ログイン時のログインコンポーネントを本文器の先頭へ移動する。
 */
export function initLoginComponent(): void {
  if (isLoggedIn()) {
    return;
  }
  if (!isSiteHome()) {
    return;
  }

  const loginBlock = document.querySelector<HTMLElement>(
    "#theme_boost-drawers-blocks section.block_login",
  );
  if (!loginBlock) {
    return;
  }

  const container = ensureHomeContainer();
  if (!container) {
    return;
  }

  container.prepend(loginBlock);
  applyStyleSheet(STYLE_ID, CSS);
}
