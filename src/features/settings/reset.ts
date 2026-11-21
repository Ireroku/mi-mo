// 設定を既定値へ戻す操作の一覧と、その実行。
// 行の文言は「〜をリセット」で揃え、確認と結果の文言はそこから作る。

import { storage, type WxtStorageItem } from "wxt/utils/storage";
import {
  coursePageAutoattendButtonSetting,
  coursePageAutoattendStatsSetting,
  coursePageExportSetting,
  coursePageGradeInlineSetting,
  coursePageReverseSectionsSetting,
  homeGreetingLastMessage,
  homeGreetingSetting,
  homeHideElementsSetting,
  menuBadgesSetting,
  menuLogoSetting,
  menuSetting,
  myCoursesTodayOrderSetting,
  periodTableSetting,
  timetableSetting,
} from "@/utils/settings";
import { withSettingLock } from "./types";

// 値の形は項目ごとに違う。キーで引くために any で受ける
type AnyItem = WxtStorageItem<any, any>;

// 戻す対象。keys を省くと項目の全体を、あればそのキーだけを既定値へ戻す
interface ResetTarget {
  item: AnyItem;
  keys?: readonly string[];
}

export interface ResetAction {
  label: string; // 「〜をリセット」の形にする
  broad?: boolean; // 範囲の大きい操作。行を赤にする
  targets: readonly ResetTarget[] | "all"; // "all" は保存領域を丸ごと空にする
}

// 押すと別の画面へ進み、中の操作を並べる
export interface ResetMenu {
  id: string; // 開いている場所を hash へ写す時の名前
  label: string;
  actions: readonly ResetAction[];
}

export type ResetEntry = ResetAction | ResetMenu;

function whole(item: AnyItem): ResetTarget {
  return { item };
}

function part<C>(
  item: WxtStorageItem<C, Record<string, never>>,
  keys: readonly (keyof C & string)[],
): ResetTarget {
  return { item, keys };
}

export const resetEntries: readonly ResetEntry[] = [
  {
    id: "reset-timetable",
    label: "時間割",
    actions: [
      { label: "時限をリセット", targets: [whole(periodTableSetting)] },
      { label: "授業科目をリセット", targets: [part(timetableSetting, ["grid"])] },
      { label: "休講日をリセット", targets: [part(timetableSetting, ["holidays"])] },
      { label: "振替日をリセット", targets: [part(timetableSetting, ["substitutes"])] },
      {
        label: "時間割をすべてリセット",
        broad: true,
        targets: [whole(timetableSetting), whole(periodTableSetting)],
      },
    ],
  },
  {
    id: "reset-greeting",
    label: "挨拶",
    actions: [
      { label: "自分の一言をリセット", targets: [part(homeGreetingSetting, ["messages"])] },
      {
        label: "挨拶をすべてリセット",
        broad: true,
        targets: [whole(homeGreetingSetting), whole(homeGreetingLastMessage)],
      },
    ],
  },
  {
    label: "ホームで非表示にする項目をリセット",
    targets: [whole(homeHideElementsSetting)],
  },
  {
    label: "コース設定をすべてリセット",
    broad: true,
    targets: [
      whole(myCoursesTodayOrderSetting),
      whole(coursePageReverseSectionsSetting),
      whole(coursePageAutoattendStatsSetting),
      whole(coursePageGradeInlineSetting),
      whole(coursePageAutoattendButtonSetting),
      whole(coursePageExportSetting),
    ],
  },
  {
    id: "reset-menu",
    label: "上部メニュー",
    actions: [
      { label: "隠す項目をリセット", targets: [part(menuSetting, ["hidden"])] },
      { label: "追加する項目をリセット", targets: [part(menuSetting, ["items"])] },
      {
        label: "上部メニューをすべてリセット",
        broad: true,
        targets: [whole(menuSetting), whole(menuLogoSetting)],
      },
    ],
  },
  { label: "カウントダウンをリセット", targets: [part(menuBadgesSetting, ["countdowns"])] },
];

// 内部の記録（コース一覧やメニュー名の控え）も含めて消す
export const resetEverything: ResetAction = {
  label: "すべての設定をリセット",
  broad: true,
  targets: "all",
};

export const resetMenus = resetEntries.filter(
  (entry): entry is ResetMenu => "actions" in entry,
);

async function resetTarget({ item, keys }: ResetTarget): Promise<void> {
  await withSettingLock(item.key, async () => {
    if (!keys) {
      // 保存値を消すと、読む側は既定値を受け取る
      await item.removeValue();
      return;
    }
    const current = await item.getValue();
    const restored = Object.fromEntries(keys.map((key) => [key, item.fallback[key]]));
    await item.setValue({ ...current, ...restored });
  });
}

/**
 * 操作の対象を既定値へ戻す。
 */
export async function runReset(action: ResetAction): Promise<void> {
  if (action.targets === "all") {
    await storage.clear("local");
    return;
  }
  await Promise.all(action.targets.map(resetTarget));
}
