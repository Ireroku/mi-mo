// 全設定項目の表示メタデータとグループ定義を集約する。

import {
  defineGroup,
  rowId,
  type SettingsGroup,
} from "./types";
import {
  extensionSetting,
  homeHideElementsSetting,
  homeGreetingSetting,
  menuSetting,
  menuBadgesSetting,
  menuLogoSetting,
  uiFloatingHintSetting,
  uiFontSetting,
  uiQuickDrawerSetting,
  uiLandingPageSetting,
  coursePageReverseSectionsSetting,
  coursePageAutoattendButtonSetting,
  coursePageAutoattendStatsSetting,
  coursePageGradeInlineSetting,
  coursePageExportSetting,
  periodTableSetting,
  timetableSetting,
  myCoursesTodayOrderSetting,
} from "@/utils/settings";

import HiddenMenuItemsField from "./fields/HiddenMenuItemsField.svelte";
import NewMenuItemsField from "./fields/NewMenuItemsField.svelte";
import PeriodTableField from "./fields/PeriodTableField.svelte";
import CountdownListField from "./fields/CountdownListField.svelte";
import PinnedCoursesField from "./fields/PinnedCoursesField.svelte";
import { FIXED_SALUTATION } from "@/features/home/greeting.logic";
import GreetingMessagesField from "./fields/GreetingMessagesField.svelte";
import TimetableGridField from "./fields/TimetableGridField.svelte";
import HolidayListField from "./fields/HolidayListField.svelte";
import SubstituteListField from "./fields/SubstituteListField.svelte";
import TimetableFooter from "./fields/TimetableFooter.svelte";

// 全機能の入り切り。タブの中ではなく、画面の最上部に置く
export const extensionGroup = defineGroup("general", "有効", extensionSetting, {
  enabled: { label: "有効", control: { kind: "toggle" } },
});

// 並べた順がそのまま表示順になる。見出し（title か section）が同じで隣り合う行は、1枚のカードにまとまる
export const settingsGroups: readonly SettingsGroup[] = [
  // --- ホーム ---
  defineGroup(
    "home",
    "時間割",
    timetableSetting,
    {
      enabled: { label: "時間割を表示する", control: { kind: "toggle" } },
      grid: {
        label: "授業科目の設定",
        control: { kind: "custom", component: TimetableGridField },
      },
      holidays: {
        label: "休講日",
        control: { kind: "custom", component: HolidayListField },
      },
      substitutes: {
        label: "振替日",
        control: { kind: "custom", component: SubstituteListField },
      },
      startDate: { label: "学期の開始日", control: { kind: "date" } },
      lessonCount: {
        label: "授業の回数",
        description: "1つの授業が何回で終わるか",
        control: { kind: "number", min: 1, max: 30, unit: "回" },
      },
      color: {
        label: "配色",
        control: {
          kind: "select",
          options: [
            { value: "moodle", label: "Moodle" },
            { value: "white", label: "白" },
            { value: "black", label: "黒" },
            { value: "sky", label: "水色" },
            { value: "pink", label: "ピンク" },
            { value: "green", label: "緑" },
          ],
        },
      },
    },
    { footer: TimetableFooter },
  ),

  defineGroup("home", "挨拶", homeGreetingSetting, {
    enabled: {
      label: "挨拶を表示する",
      description: "ホームの上部に、ひとことを出します",
      control: { kind: "toggle" },
    },
    salutation: {
      label: "名前の前の言葉",
      description: "「こんにちは、〇〇さん」の形で出します",
      control: {
        kind: "select",
        options: [
          { value: "time", label: "時間帯に合わせる" },
          { value: "fixed", label: FIXED_SALUTATION },
          { value: "none", label: "なし" },
        ],
      },
    },
    messages: {
      label: "メッセージ",
      description: "この中から毎回1つ選ばれます",
      control: { kind: "custom", component: GreetingMessagesField },
    },
  }),

  defineGroup(
    "home",
    "時限表",
    periodTableSetting,
    {
      periods: {
        label: "各時限の時刻",
        description: "時計の時限表示にも使用します",
        section: "時間割",
        control: { kind: "custom", component: PeriodTableField },
      },
    },
    { after: rowId(timetableSetting.key, "enabled") },
  ),

  defineGroup("home", "非表示にする項目", homeHideElementsSetting, {
    announcements: { label: "お知らせ", control: { kind: "toggle" } },
    categories: { label: "コースカテゴリ", control: { kind: "toggle" } },
    search: { label: "コース検索", control: { kind: "toggle" } },
  }),

  // --- コース ---
  defineGroup("course", "マイコース", myCoursesTodayOrderSetting, {
    enabled: {
      label: "マイコースの先頭に今日の授業を表示する",
      description: "「ホーム」タブの時間割情報を使用します",
      control: { kind: "toggle" },
    },
  }),

  defineGroup("course", "コースページ", coursePageReverseSectionsSetting, {
    enabled: {
      label: "セクション（授業回）を逆順に並べる",
      control: { kind: "toggle" },
    },
  }),

  defineGroup("course", "コースページ", coursePageAutoattendStatsSetting, {
    enabled: {
      label: "出席率をコース上部に表示する",
      description: "Autoattendのみ対応",
      control: { kind: "toggle" },
    },
  }),

  defineGroup("course", "コースページ", coursePageGradeInlineSetting, {
    enabled: {
      label: "課題の横に得点を表示する",
      control: { kind: "toggle" },
    },
  }),

  defineGroup("course", "出欠確認ボタン", coursePageAutoattendButtonSetting, {
    enabled: {
      label: "出欠確認ボタンを表示する",
      control: { kind: "toggle" },
    },
    placement: {
      label: "表示する場所",
      control: {
        kind: "select",
        options: [
          { value: "top", label: "コース最上部" },
          { value: "floating", label: "画面の右下" },
        ],
      },
    },
  }),

  defineGroup("course", "セクションの書き出し", coursePageExportSetting, {
    enabled: {
      label: "書き出しボタンを表示する",
      description: "セクションの内容をテキストとして保存します",
      control: { kind: "toggle" },
    },
    format: {
      label: "書き出し形式",
      control: {
        kind: "select",
        options: [
          { value: "markdown", label: "Markdown (.md)" },
          { value: "text", label: "テキスト (.txt)" },
        ],
      },
    },
  }),

  // --- 全体 ---
  defineGroup("general", "上部メニュー", menuSetting, {
    hidden: {
      label: "隠す項目",
      description: "名称が一致する項目を非表示にします",
      control: { kind: "custom", component: HiddenMenuItemsField },
    },
    items: {
      label: "追加する項目",
      control: { kind: "custom", component: NewMenuItemsField },
    },
  }),

  defineGroup("general", "上部メニュー", menuLogoSetting, {
    hidden: {
      label: "ロゴを隠す",
      control: { kind: "toggle" },
    },
  }),

  defineGroup("general", "時計", menuBadgesSetting, {
    clock: {
      label: "時計のオプション",
      control: {
        kind: "nested",
        fields: {
          showSeconds: { label: "秒", control: { kind: "toggle" } },
          hour12: { label: "12時間表記", control: { kind: "toggle" } },
          showDate: { label: "日付", control: { kind: "toggle" } },
          showYear: { label: "年", control: { kind: "toggle" } },
          showWeekday: { label: "曜日", control: { kind: "toggle" } },
          showPeriod: { label: "時限", control: { kind: "toggle" } },
        },
      },
    },
    countdowns: {
      label: "表示する項目",
      section: "カウントダウン",
      control: {
        kind: "custom",
        component: CountdownListField,
        // ラベルも日時も入っていない行は、足しただけの行として閉じる時に消す。時限の対象はラベルを持たない
        prune: (list) =>
          list.filter(
            (item) =>
              item.source.kind === "nextPeriod" ||
              item.label.trim() !== "" ||
              item.source.at !== "",
          ),
      },
    },
  }),

  defineGroup("general", "ヒントボタン", uiFloatingHintSetting, {
    hidden: {
      label: "右下のヒント（？）ボタンを隠す",
      control: { kind: "toggle" },
    },
  }),

  defineGroup("general", "右のドロワー", uiQuickDrawerSetting, {
    hidden: {
      label: "ドロワーを隠す",
      control: { kind: "toggle" },
    },
    pinned: {
      label: "ピン留めするコース",
      description: "ドロワーの最上部に固定して表示します",
      control: { kind: "custom", component: PinnedCoursesField, fill: true },
    },
  }),

  defineGroup("general", "ログイン後", uiLandingPageSetting, {
    enabled: {
      label: "ログイン後に特定のページを表示する",
      control: { kind: "toggle" },
    },
    url: {
      label: "ページのURL",
      control: {
        kind: "text",
        placeholder: "https://lms-m41.mie-u.ac.jp/my/courses.php",
      },
    },
  }),

  defineGroup("general", "フォント", uiFontSetting, {
    enabled: {
      label: "フォントを変える",
      control: { kind: "toggle" },
    },
    family: {
      label: "フォント名",
      description: "利用できるのはこのPCにインストールされたフォントのみです",
      control: { kind: "text", placeholder: "Noto Sans JP, sans-serif" },
    },
    scope: {
      label: "適用範囲",
      control: {
        kind: "select",
        options: [
          { value: "all", label: "ページ全体" },
          { value: "main", label: "本文のみ" },
        ],
      },
    },
  }),
];
