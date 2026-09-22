// document_start で動くもの。描画前に CSS を注入するものなど
import { applyHideElements } from "@/features/home/hideElements";
import { homeHideElementsSetting } from "@/utils/settings";

export default defineContentScript({
  matches: ["*://lms-m41.mie-u.ac.jp/*"],
  runAt: "document_start",
  async main() {
    const config = await homeHideElementsSetting.getValue();
    applyHideElements(config);
  },
});
