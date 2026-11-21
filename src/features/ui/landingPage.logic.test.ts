import { describe, expect, it } from "vitest";
import { decideLanding, type LandingPageConfig } from "./landingPage.logic";

const ORIGIN = "https://lms-m41.mie-u.ac.jp";
const config: LandingPageConfig = { enabled: true, url: `${ORIGIN}/my/courses.php` };
const at = (path: string) => new URL(path, ORIGIN);

describe("decideLanding", () => {
  it("無効な時は印を消し、移動しない", () => {
    expect(decideLanding({ ...config, enabled: false }, true, true, at("/my/"))).toEqual({
      pending: false,
    });
  });

  it("ログインしていないページで印を付ける", () => {
    expect(decideLanding(config, false, false, at("/"))).toEqual({ pending: true });
    expect(decideLanding(config, false, false, at("/login/index.php"))).toEqual({ pending: true });
  });

  it("印があり、既定の遷移先に着いたら移動する", () => {
    for (const path of ["/my/", "/my/index.php", "/", "/index.php"]) {
      expect(decideLanding(config, true, true, at(path))).toEqual({
        pending: false,
        redirectTo: `${ORIGIN}/my/courses.php`,
      });
    }
  });

  it("印が無ければ移動しない", () => {
    expect(decideLanding(config, false, true, at("/my/"))).toEqual({ pending: false });
  });

  it("既定の遷移先でなければ印を使い切り、移動しない", () => {
    expect(decideLanding(config, true, true, at("/course/view.php?id=1"))).toEqual({
      pending: false,
    });
  });

  it("移動先が今の場所と同じなら移動しない", () => {
    expect(decideLanding(config, true, true, at("/my/courses.php"))).toEqual({ pending: false });
  });

  it("移動先が別のホストか、URL として読めなければ移動しない", () => {
    expect(
      decideLanding({ ...config, url: "https://example.com/" }, true, true, at("/my/")),
    ).toEqual({ pending: false });
    expect(decideLanding({ ...config, url: "http://[" }, true, true, at("/my/"))).toEqual({
      pending: false,
    });
  });

  it("相対パスの移動先は Moodle のホストとして読む", () => {
    expect(decideLanding({ ...config, url: "/calendar/view.php" }, true, true, at("/my/"))).toEqual(
      { pending: false, redirectTo: `${ORIGIN}/calendar/view.php` },
    );
  });
});
