// OS のカラースキーム（prefers-color-scheme）を監視し、
// document.documentElement に dark クラスを同期する。

export function syncColorScheme(): void {
  if (typeof window === "undefined" || !window.matchMedia) return;

  const mql = window.matchMedia("(prefers-color-scheme: dark)");

  const update = (matches: boolean) => {
    document.documentElement.classList.toggle("dark", matches);
  };

  update(mql.matches);

  mql.addEventListener("change", (e) => {
    update(e.matches);
  });
}
