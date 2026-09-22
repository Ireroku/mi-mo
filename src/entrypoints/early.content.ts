// document_start で動くもの。描画前に CSS を注入するものなど
import { applyHideElements } from "@/features/home/hideElements";
import { applyMenuLogo } from "@/features/menu/logo";
import { applyFloatingHint } from "@/features/ui/floatingHint";
import {
  homeHideElementsSetting,
  menuLogoSetting,
  uiFloatingHintSetting,
} from "@/utils/settings";
import { applySectionTitleLink } from "@/features/coursePage/sectionTitleLink";
import { applySectionToggleDesign } from "@/features/coursePage/sectionToggleDesign";
import { applyClickableCard } from "@/features/myCourses/clickableCard";
import { applyBreadcrumb } from "@/features/ui/breadcrumb";

export default defineContentScript({
  matches: ["*://lms-m41.mie-u.ac.jp/*"],
  runAt: "document_start",
  async main() {
    const [homeHideElements, menuLogo, uiFloatingHint] = await Promise.all([
      homeHideElementsSetting.getValue(),
      menuLogoSetting.getValue(),
      uiFloatingHintSetting.getValue(),
    ]);
    applyHideElements(homeHideElements);
    applyMenuLogo(menuLogo);
    applyFloatingHint(uiFloatingHint);
    applySectionTitleLink();
    applySectionToggleDesign();
    applyClickableCard();
    applyBreadcrumb();
  },
});
