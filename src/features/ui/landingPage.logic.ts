// ログイン直後に開くページを、設定した URL へ差し替える。
// ログインしていないページを通った印を控え、ログイン後の最初のページで使い切る。

export interface LandingPageConfig {
  enabled: boolean;
  url: string;
}

export interface LandingDecision {
  pending: boolean;
  redirectTo?: string;
}

// Moodle がログイン後に開く既定のページ。ダッシュボード、マイコース、サイトホームのどれかになる
const DEFAULT_LANDINGS = new Set(["/my/", "/my/index.php", "/my/courses.php", "/", "/index.php"]);

/**
 * ログイン後のランディング先を判定する。
 */
export function decideLanding(
  config: LandingPageConfig,
  pending: boolean,
  loggedIn: boolean,
  location: Pick<Location, "href" | "host" | "origin" | "pathname">,
): LandingDecision {
  if (!config.enabled) {
    return { pending: false };
  }

  // ログインフォームはサイトホームにもあり、送信先のログインページはすぐリダイレクトする。
  // ログインページだけを見ると印を付け損なうため、ログインしていないページ全体で印を付ける
  if (!loggedIn) {
    return { pending: true };
  }

  // ここから先はログイン後の最初のページ。どの道を通っても印は使い切る
  if (!pending || !DEFAULT_LANDINGS.has(location.pathname) || !config.url) {
    return { pending: false };
  }

  try {
    const targetUrl = new URL(config.url, location.origin);
    if (targetUrl.host !== location.host || targetUrl.href === location.href) {
      return { pending: false };
    }
    return { pending: false, redirectTo: targetUrl.href };
  } catch {
    return { pending: false };
  }
}
