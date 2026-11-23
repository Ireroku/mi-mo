// コースページで、セクション本体とヘッダーの対応と、セクション・活動の名前やリンクを読み取る。

// コースページはセクションの一覧、セクションの個別ページ（course/section.php）は1件だけを置く。
const SECTION_SELECTOR = [
  '#region-main div.course-content > div > ul[data-for="course_sectionlist"] > li.section',
  "#region-main div.course-content div.single-section > ul > li.section",
].join(", ");

export function findCourseSectionHeaders(): { section: Element; header: Element }[] {
  const sections = document.querySelectorAll(SECTION_SELECTOR);
  return Array.from(sections).flatMap((section) => {
    const header = section.querySelector(".course-section-header");
    return header ? [{ section, header }] : [];
  });
}

/**
 * セクションのタイトル（`.sectionname` の文字列）を、前後の空白を除いて返す。無ければ空文字を返す。
 * セクションの個別ページはセクション内にタイトルを持たず、ページの見出しに出すため、そちらを読む。
 */
export function readSectionTitle(section: Element): string {
  const title =
    section.querySelector(".sectionname") ??
    (section.closest(".single-section") &&
      document.querySelector(".page-header-headings h1"));
  return title?.textContent?.trim() ?? "";
}

/**
 * 活動（`li.activity`）の名前へのリンクを返す。
 */
export function activityLink(activity: Element): HTMLAnchorElement | null {
  return activity.querySelector<HTMLAnchorElement>(".activityname a");
}

/**
 * 活動の名前を返す。`data-activityname` を優先し、無ければリンクの文字列を使う。どちらも無ければ空文字を返す。
 * リンクの文字列は種別のラベルを含むため、属性を先に読む。
 */
export function readActivityName(activity: Element): string {
  return (
    activity
      .querySelector(".activity-item")
      ?.getAttribute("data-activityname")
      ?.trim() ||
    activityLink(activity)?.textContent?.trim() ||
    ""
  );
}
