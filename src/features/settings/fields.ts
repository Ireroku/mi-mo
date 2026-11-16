// 全設定項目の表示メタデータとグループ定義を集約する。

import {
  defineGroup,
  type SettingsGroup,
} from "./types";
import {
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
import GreetingMessagesField from "./fields/GreetingMessagesField.svelte";
import TimetableGridField from "./fields/TimetableGridField.svelte";
import HolidayListField from "./fields/HolidayListField.svelte";
import SubstituteListField from "./fields/SubstituteListField.svelte";
import IcsExportButton from "./fields/IcsExportButton.svelte";

// 並べた順がそのまま表示順になる。タブの中では、よく変えるものを上に置く
export const settingsGroups: readonly SettingsGroup[] = [
  // --- ホーム ---
  defineGroup(
    "home",
    "時間割",
    timetableSetting,
    {
      enabled: { label: "時間割を表示する", control: { kind: "toggle" } },
      grid: {
        label: "授業",
        description: "曜日と時限ごとの科目名とリンク",
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
            { value: "white", label: "白" },
            { value: "black", label: "黒" },
            { value: "sky", label: "水色" },
            { value: "pink", label: "ピンク" },
            { value: "green", label: "緑" },
          ],
        },
      },
    },
    IcsExportButton,
  ),

  defineGroup("home", "挨拶", homeGreetingSetting, {
    enabled: {
      label: "挨拶を表示する",
      description: "ホームの上部に、ひとことを出します",
      control: { kind: "toggle" },
    },
    messages: {
      label: "メッセージ",
      description: "この中から毎回1つ選ばれます",
      control: { kind: "custom", component: GreetingMessagesField },
    },
  }),

  defineGroup("home", "ホームから隠すもの", homeHideElementsSetting, {
    announcements: { label: "お知らせ", control: { kind: "toggle" } },
    categories: { label: "コースカテゴリ", control: { kind: "toggle" } },
    search: { label: "コース検索", control: { kind: "toggle" } },
  }),

  // --- コース ---
  defineGroup("course", "マイコースの並び順", myCoursesTodayOrderSetting, {
    enabled: {
      label: "今日の授業をマイコースの先頭に並べる",
      description: "時間割に登録した授業から判断します",
      control: { kind: "toggle" },
    },
  }),

  defineGroup("course", "セクションの並び順", coursePageReverseSectionsSetting, {
    enabled: {
      label: "最新の回を一番上に並べる",
      control: { kind: "toggle" },
    },
  }),

  defineGroup("course", "出席率の表示", coursePageAutoattendStatsSetting, {
    enabled: {
      label: "出席率をコースの上部に表示する",
      control: { kind: "toggle" },
    },
  }),

  defineGroup("course", "得点の表示", coursePageGradeInlineSetting, {
    enabled: {
      label: "課題の横に得点を表示する",
      description: "フィードバックがあれば一緒に表示します",
      control: { kind: "toggle" },
    },
  }),

  defineGroup("course", "出欠確認ボタン", coursePageAutoattendButtonSetting, {
    enabled: {
      label: "出欠確認ボタンを目立つ位置に置く",
      control: { kind: "toggle" },
    },
    placement: {
      label: "置く場所",
      control: {
        kind: "select",
        options: [
          { value: "top", label: "コースの最上部" },
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
      label: "形式",
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
  defineGroup("general", "時計とカウントダウン", menuBadgesSetting, {
    clock: {
      label: "時計に表示するもの",
      control: {
        kind: "nested",
        fields: {
          showSeconds: { label: "秒", control: { kind: "toggle" } },
          showDate: { label: "日付", control: { kind: "toggle" } },
          showWeekday: { label: "曜日", control: { kind: "toggle" } },
          showPeriod: { label: "時限", control: { kind: "toggle" } },
        },
      },
    },
    countdowns: {
      label: "カウントダウン",
      control: { kind: "custom", component: CountdownListField },
    },
  }),

  defineGroup("general", "上部メニュー", menuSetting, {
    hidden: {
      label: "隠す項目",
      description: "上部メニューから消す項目の名前",
      control: { kind: "custom", component: HiddenMenuItemsField },
    },
    items: {
      label: "追加する項目",
      control: { kind: "custom", component: NewMenuItemsField },
    },
  }),

  defineGroup("general", "ロゴ", menuLogoSetting, {
    hidden: {
      label: "上部メニューのロゴを隠す",
      control: { kind: "toggle" },
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
      description: "右のブロックドロワーを表示しません",
      control: { kind: "toggle" },
    },
    pinned: {
      label: "ピン留めするコース",
      description: "ドロワーの最上部に固定して表示します",
      control: { kind: "custom", component: PinnedCoursesField },
    },
  }),

  defineGroup("general", "ログイン直後のページ", uiLandingPageSetting, {
    enabled: {
      label: "ログイン直後に決めたページを開く",
      control: { kind: "toggle" },
    },
    url: {
      label: "開くページの URL",
      description: "マイコースや、よく開くコースの URL",
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
      description: "この PC に入っているフォントの名前",
      control: { kind: "text", placeholder: "Noto Sans JP, sans-serif" },
    },
    scope: {
      label: "適用する範囲",
      control: {
        kind: "select",
        options: [
          { value: "all", label: "ページ全体" },
          { value: "main", label: "本文のみ" },
        ],
      },
    },
  }),

  defineGroup("general", "時限表", periodTableSetting, {
    periods: {
      label: "各時限の時刻",
      description: "時計の時限表示と時間割が使います",
      control: { kind: "custom", component: PeriodTableField },
    },
  }),
];
