// コースセクションの活動を Markdown またはテキストとして書き出すボタンをセクションヘッダーに追加する。

import { isCoursePage } from "@/moodle/page";
import { findCourseSectionHeaders } from "@/moodle/courseSections";
import { saveBlob } from "@/utils/download";
import { sanitizeFilename } from "@/utils/filename";
import {
  formatSection,
  readSection,
  type ExportFormat,
} from "./export.logic";
import { addSectionAction } from "./sectionActions";

export interface ExportConfig {
  enabled: boolean;
  format: ExportFormat;
}

/**
 * コースページの各セクションに書き出しボタンを配置する。
 */
export function initExportMarkdown(config: ExportConfig): void {
  if (!config.enabled || !isCoursePage()) {
    return;
  }

  for (const { section, header } of findCourseSectionHeaders()) {
    const button = addSectionAction(header, "mimo-export-button", "書き出す");
    if (!button) {
      continue;
    }

    button.addEventListener("click", (e) => {
      e.stopPropagation();

      const exported = readSection(section, config.format);
      const text = formatSection(exported, config.format);

      const ext = config.format === "markdown" ? "md" : "txt";
      const mimeType =
        config.format === "markdown" ? "text/markdown" : "text/plain";
      const rawTitle = exported.title || "section";
      const safeTitle = sanitizeFilename(rawTitle);
      const filename = `${safeTitle}.${ext}`;

      saveBlob(new Blob([text], { type: `${mimeType};charset=utf-8` }), filename);
    });
  }
}
