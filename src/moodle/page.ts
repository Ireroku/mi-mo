// 今表示しているページが Moodle のどの画面かを判定する。
// 判定の実体は getMoodlePage だけが持ち、is~ はその結果を比較するだけにとどめる。

export type MoodlePage =
  | "siteHome"
  | "dashboard"
  | "myCourses"
  | "coursePage"
  | "other";

type KnownPage = Exclude<MoodlePage, "other">;

// 判定の軸は body の pagelayout-* に統一する。照合の順序を考えずに済むため。
// course-<id> と context-<num> はコースやユーザーごとに変わるので使わない。
const PAGE_CLASSES: Record<KnownPage, string> = {
  siteHome: "pagelayout-frontpage",
  dashboard: "pagelayout-mydashboard",
  myCourses: "pagelayout-mycourses",
  coursePage: "pagelayout-course",
};

export function getMoodlePage(): MoodlePage {
  const { body } = document;

  // document_start の時点では body がまだ無い。
  if (!body) return "other";

  const pages = Object.keys(PAGE_CLASSES) as KnownPage[];
  return (
    pages.find((page) => body.classList.contains(PAGE_CLASSES[page])) ?? "other"
  );
}

export function isSiteHome(): boolean {
  return getMoodlePage() === "siteHome";
}

export function isDashboard(): boolean {
  return getMoodlePage() === "dashboard";
}

export function isMyCourses(): boolean {
  return getMoodlePage() === "myCourses";
}

export function isCoursePage(): boolean {
  return getMoodlePage() === "coursePage";
}
