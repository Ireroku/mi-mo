// サイト全体で読み込むもの
import { initMenu } from "@/features/menu";

export default defineContentScript({
  matches: ["*://lms-m41.mie-u.ac.jp/*"],

  main() {
    initMenu();
  },
});
