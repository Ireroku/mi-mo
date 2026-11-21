// document_start で動くもの。描画前に CSS を注入するものなど
import { applyHideElements, type HideElementsConfig } from "@/features/home/hideElements";
import { applyMenuLogo, type MenuLogoConfig } from "@/features/menu/logo";
import { applyFloatingHint, type FloatingHintConfig } from "@/features/ui/floatingHint";
import { applyFont, type FontConfig } from "@/features/ui/font";
import {
  applyReverseSections,
  type ReverseSectionsConfig,
} from "@/features/coursePage/reverseSections";
import { applyQuickDrawerVisibility, type QuickDrawerConfig } from "@/features/ui/quickDrawer";
import { hideNavbarItemsEarly } from "@/features/menu/navbar/menu.manager";
import type { MenuConfig } from "@/features/menu/navbar/types";
import { decideLanding } from "@/features/ui/landingPage.logic";
import { readLoggedIn } from "@/moodle/user";
import {
  extensionSetting,
  homeHideElementsSetting,
  menuLogoSetting,
  uiFloatingHintSetting,
  uiFontSetting,
  coursePageReverseSectionsSetting,
  uiQuickDrawerSetting,
  menuSetting,
  uiLandingPageSetting,
  uiLandingPendingFlag,
  type ExtensionConfig,
} from "@/utils/settings";
import { applySectionTitleLink } from "@/features/coursePage/sectionTitleLink";
import { applySectionToggleDesign } from "@/features/coursePage/sectionToggleDesign";
import { applyClickableCard } from "@/features/myCourses/clickableCard";
import { applyBreadcrumb } from "@/features/ui/breadcrumb";
import { runFeature } from "@/utils/runFeature";
import { readPageCache, writePageCache } from "@/utils/pageCache";
import { removeAllStyleSheets } from "@/utils/styleSheet";

// CSS を当てるだけの機能が使う設定。ページの localStorage へ写すため、氏名やコース名を入れない
interface EarlySettings {
  extension: ExtensionConfig;
  hideElements: HideElementsConfig;
  menuLogo: MenuLogoConfig;
  floatingHint: FloatingHintConfig;
  font: FontConfig;
  reverseSections: ReverseSectionsConfig;
  quickDrawer: Pick<QuickDrawerConfig, "hidden">;
  menu: Pick<MenuConfig, "hidden">;
}

const CACHE_KEY = "mimo:early";

// どれも style 要素を1つ入れるか差し替えるか、属性の印を付け直すだけ。同じ設定で呼び直しても変わらない。
// 間の await はマイクロタスクで、描画の前に流れ切る
async function applyEarly(settings: EarlySettings): Promise<void> {
  // 全体のスイッチが切られている間は、どの機能も動かさない。写しで当てた分も外す
  if (!settings.extension.enabled) {
    removeAllStyleSheets();
    return;
  }

  // 機能は互いに独立している。1つが失敗しても残りを動かす。
  await runFeature("hideElements", () => applyHideElements(settings.hideElements));
  await runFeature("menuLogo", () => applyMenuLogo(settings.menuLogo));
  await runFeature("floatingHint", () => applyFloatingHint(settings.floatingHint));
  await runFeature("font", () => applyFont(settings.font));
  await runFeature("reverseSections", () => applyReverseSections(settings.reverseSections));
  await runFeature("quickDrawer", () => applyQuickDrawerVisibility(settings.quickDrawer));
  await runFeature("menuHidden", () => hideNavbarItemsEarly(settings.menu));
  await runFeature("sectionTitleLink", () => applySectionTitleLink());
  await runFeature("sectionToggleDesign", () => applySectionToggleDesign());
  await runFeature("clickableCard", () => applyClickableCard());
  await runFeature("breadcrumb", () => applyBreadcrumb());
}

export default defineContentScript({
  matches: ["*://lms-m41.mie-u.ac.jp/*"],
  runAt: "document_start",
  async main() {
    // storage.local を待つ間に最初の描画が済むことがあるため、前回の写しで先に当てる
    const version = browser.runtime.getManifest().version;
    const cached = readPageCache<EarlySettings>(CACHE_KEY, version);
    if (cached) {
      await applyEarly(cached);
    }

    const [
      extension,
      homeHideElements,
      menuLogo,
      uiFloatingHint,
      uiFont,
      coursePageReverseSections,
      quickDrawerConfig,
      menuConfig,
      landingConfig,
      landingPending,
    ] = await Promise.all([
      extensionSetting.getValue(),
      homeHideElementsSetting.getValue(),
      menuLogoSetting.getValue(),
      uiFloatingHintSetting.getValue(),
      uiFontSetting.getValue(),
      coursePageReverseSectionsSetting.getValue(),
      uiQuickDrawerSetting.getValue(),
      menuSetting.getValue(),
      uiLandingPageSetting.getValue(),
      uiLandingPendingFlag.getValue(),
    ]);

    // 正本で当て直し、写しも正本に合わせる。写しと同じなら中身は変わらない
    const settings: EarlySettings = {
      extension,
      hideElements: homeHideElements,
      menuLogo,
      floatingHint: uiFloatingHint,
      font: uiFont,
      reverseSections: coursePageReverseSections,
      quickDrawer: { hidden: quickDrawerConfig.hidden },
      menu: { hidden: menuConfig.hidden },
    };
    writePageCache(CACHE_KEY, version, settings);
    await applyEarly(settings);
    if (!extension.enabled) {
      return;
    }

    // 最初の画面の判定は body を待つことがあるため、CSS を当てるだけの機能より後に置く
    await runFeature("landingPage", async () => {
      // 切ってある間は body を待たない
      const loggedIn = landingConfig.enabled ? await readLoggedIn() : true;
      const decision = decideLanding(landingConfig, landingPending, loggedIn, window.location);
      if (decision.pending !== landingPending) {
        await uiLandingPendingFlag.setValue(decision.pending);
      }
      if (decision.redirectTo) {
        window.location.replace(decision.redirectTo);
      }
    });
  },
});
