// Moodle のページに出ている履修コースの一覧を読み取る。
// 設定画面がコースを選ぶ候補として使うため、読み取った結果は entrypoint がストレージへ控える。

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
    try {
      const parsedUrl = new URL(a.href, window.location.origin);
      const id = parsedUrl.searchParams.get("id");
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
    } catch {
      // 不正な URL はスキップ
      continue;
    }
  }

  return courses;
}
