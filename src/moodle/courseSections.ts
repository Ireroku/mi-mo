// コースページで、セクション本体とヘッダーの対応を読み取る。

export function findCourseSectionHeaders(): { section: Element; header: Element }[] {
  const sections = document.querySelectorAll(
    '#region-main div.course-content > div > ul[data-for="course_sectionlist"] > li.section',
  );
  return Array.from(sections).flatMap((section) => {
    const header = section.querySelector(".course-section-header");
    return header ? [{ section, header }] : [];
  });
}
