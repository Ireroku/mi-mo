// document_start で動くもの。描画前に CSS を注入するものなど
import { applyHideElements } from "@/features/home/hideElements";
import { applyMenuLogo } from "@/features/menu/logo";
import { applyFloatingHint } from "@/features/ui/floatingHint";
import { applyFont } from "@/features/ui/font";
import { applyReverseSections } from "@/features/coursePage/reverseSections";
import { applyQuickDrawerVisibility } from "@/features/ui/quickDrawer";
import { decideLanding } from "@/features/ui/landingPage";
import {
  homeHideElementsSetting,
  menuLogoSetting,
  uiFloatingHintSetting,
  uiFontSetting,
  coursePageReverseSectionsSetting,
  uiQuickDrawerSetting,
  uiLandingPageSetting,
  uiLandingPendingFlag,
} from "@/utils/settings";
import { applySectionTitleLink } from "@/features/coursePage/sectionTitleLink";
import { applySectionToggleDesign } from "@/features/coursePage/sectionToggleDesign";
import { applyClickableCard } from "@/features/myCourses/clickableCard";
import { applyBreadcrumb } from "@/features/ui/breadcrumb";
import { runFeature } from "@/utils/runFeature";

export default defineContentScript({
  matches: ["*://lms-m41.mie-u.ac.jp/*"],
  runAt: "document_start",
  async main() {
    const [
      homeHideElements,
      menuLogo,
      uiFloatingHint,
      uiFont,
      coursePageReverseSections,
      quickDrawerConfig,
      landingConfig,
      landingPending,
    ] = await Promise.all([
      homeHideElementsSetting.getValue(),
      menuLogoSetting.getValue(),
      uiFloatingHintSetting.getValue(),
      uiFontSetting.getValue(),
      coursePageReverseSectionsSetting.getValue(),
      uiQuickDrawerSetting.getValue(),
      uiLandingPageSetting.getValue(),
      uiLandingPendingFlag.getValue(),
    ]);

    // 機能は互いに独立している。1つが失敗しても残りを動かす。
    await runFeature("hideElements", () => applyHideElements(homeHideElements));
    await runFeature("menuLogo", () => applyMenuLogo(menuLogo));
    await runFeature("floatingHint", () => applyFloatingHint(uiFloatingHint));
    await runFeature("font", () => applyFont(uiFont));
    await runFeature("reverseSections", () =>
      applyReverseSections(coursePageReverseSections),
    );
    await runFeature("quickDrawer", () =>
      applyQuickDrawerVisibility(quickDrawerConfig),
    );

    let redirected = false;
    await runFeature("landingPage", async () => {
      const decision = decideLanding(landingConfig, landingPending, window.location);
      if (decision.pending !== landingPending) {
        await uiLandingPendingFlag.setValue(decision.pending);
      }
      if (decision.redirectTo) {
        window.location.replace(decision.redirectTo);
        redirected = true;
      }
    });
    if (redirected) {
      return;
    }

    await runFeature("sectionTitleLink", () => applySectionTitleLink());
    await runFeature("sectionToggleDesign", () => applySectionToggleDesign());
    await runFeature("clickableCard", () => applyClickableCard());
    await runFeature("breadcrumb", () => applyBreadcrumb());
  },
});
