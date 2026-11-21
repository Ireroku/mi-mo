// Moodle のページに出ている履修コースの一覧を読み取る。
// 設定画面がコースを選ぶ候補として使うため、読み取った結果は entrypoint がストレージへ控える。

import { readIdParam } from "@/utils/url";

export interface CourseRef {
  id: string;
  title: string;
  url: string;
}

/**
 * Moodleのページに出ている履修コースの一覧を読み取る。
 * #theme_boost-drawers-blocks section[data-block="course_list"] ul.unlist li a[href] から抽出。
 */
export function readCourseList(): CourseRef[] {
  const links = document.querySelectorAll<HTMLAnchorElement>(
    '#theme_boost-drawers-blocks section[data-block="course_list"] ul.unlist li a[href]',
  );

  const seenIds = new Set<string>();
  const courses: CourseRef[] = [];
  for (const a of links) {
    // 不正な URL は id が null になり、飛ばす
    const id = readIdParam(a.href);
    if (!id || seenIds.has(id)) {
      continue;
    }

    const title = a.textContent?.trim() ?? "";
    seenIds.add(id);
    courses.push({
      id,
      title,
      url: a.href,
    });
  }

  return courses;
}
