// Moodle の表示に使うフォントを差し替える。
// 利用者の環境に入っているフォントを名前で指定し、本文だけか画面全体かを選ぶ。

import { applyStyleSheet } from "@/utils/styleSheet";

export type FontScope = "main" | "all";

export interface FontConfig {
  enabled: boolean;
  family: string;
  scope: FontScope;
}

const STYLE_ID = "mimo-ui-font";

function sanitizeFontFamily(name: string): string {
  return name.replace(/["\\\r\n]/g, "").trim();
}

/**
 * Moodle のフォントを指定されたフォント名に差し替える。
 */
export function applyFont(config: FontConfig): void {
  const cleanFamily = sanitizeFontFamily(config.family);
  if (!config.enabled || cleanFamily.length === 0) {
    applyStyleSheet(STYLE_ID, "");
    return;
  }

  const selector = config.scope === "main" ? "#region-main" : "body";
  const css = `
${selector} {
  font-family: "${cleanFamily}", system-ui, sans-serif !important;
}
`;
  applyStyleSheet(STYLE_ID, css);
}
