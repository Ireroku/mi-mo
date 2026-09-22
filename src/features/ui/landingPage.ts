// ログイン直後に開くページを、設定した URL へ差し替える。
// ログインページを通った印を控え、既定の遷移先へ着いた時だけ移動する。

export interface LandingPageConfig {
  enabled: boolean;
  url: string;
}

export interface LandingDecision {
  pending: boolean;
  redirectTo?: string;
}

/**
 * ログイン後のランディング先を判定する。
 */
export function decideLanding(
  config: LandingPageConfig,
  pending: boolean,
  location: Location,
): LandingDecision {
  if (!config.enabled) {
    return { pending: false };
  }

  if (location.pathname.startsWith("/login/index.php")) {
    return { pending: true };
  }

  if (!pending) {
    return { pending: false };
  }

  // 既定の遷移先（ダッシュボードかサイトホーム）以外に着いた場合は印を保つ
  const isDefaultLanding =
    location.pathname === "/my/" ||
    location.pathname === "/" ||
    location.pathname === "/index.php";

  if (!isDefaultLanding) {
    return { pending: true };
  }

  if (!config.url) {
    return { pending: false };
  }

  try {
    const targetUrl = new URL(config.url, location.origin);
    if (targetUrl.host !== location.host) {
      return { pending: false };
    }

    if (targetUrl.href === location.href) {
      return { pending: false };
    }

    return {
      pending: false,
      redirectTo: targetUrl.href,
    };
  } catch {
    return { pending: false };
  }
}
