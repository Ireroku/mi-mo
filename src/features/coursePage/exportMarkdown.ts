// コースセクションの活動を Markdown またはテキストとして書き出すボタンをセクションヘッダーに追加する。

import { isCoursePage } from "@/moodle/page";
import { findCourseSectionHeaders } from "@/moodle/courseSections";
import { requestDownloads, toTextDataUrl } from "@/utils/download";
import {
  formatSection,
  readSection,
  type ExportFormat,
} from "./export.logic";

export interface ExportConfig {
  enabled: boolean;
  format: ExportFormat;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, "-").trim();
}

/**
 * コースページの各セクションに書き出しボタンを配置する。
 */
export function initExportMarkdown(config: ExportConfig): void {
  if (!config.enabled || !isCoursePage()) {
    return;
  }

  for (const { section, header } of findCourseSectionHeaders()) {
    // 既にボタンが存在する場合は追加しない
    if (header.querySelector(".mimo-export-button")) {
      continue;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "btn btn-outline-secondary btn-sm text-nowrap mimo-export-button ml-2";
    button.textContent = "書き出す";

    button.addEventListener("click", (e) => {
      e.stopPropagation();

      const exported = readSection(section);
      const text = formatSection(exported, config.format);

      const ext = config.format === "markdown" ? "md" : "txt";
      const mimeType =
        config.format === "markdown" ? "text/markdown" : "text/plain";
      const rawTitle = exported.title || "section";
      const safeTitle = sanitizeFilename(rawTitle);
      const filename = `${safeTitle}.${ext}`;

      const dataUrl = toTextDataUrl(text, mimeType);
      requestDownloads([{ url: dataUrl, filename }]).catch((error: unknown) => {
        console.error("[mi-mo] exportMarkdown", error);
        button.textContent = "保存に失敗しました";
      });
    });

    header.appendChild(button);
  }
}
