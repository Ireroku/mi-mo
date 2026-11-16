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

export const settingsGroups: readonly SettingsGroup[] = [
  // --- UI ---
  defineGroup("ui", "メニュー項目", menuSetting, {
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

  defineGroup("ui", "時計とカウントダウン", menuBadgesSetting, {
    clock: {
      label: "時計の表示",
      control: {
        kind: "nested",
        fields: {
          showSeconds: { label: "秒を表示する", control: { kind: "toggle" } },
          showDate: { label: "日付を表示する", control: { kind: "toggle" } },
          showWeekday: { label: "曜日を表示する", control: { kind: "toggle" } },
          showPeriod: { label: "時限を表示する", control: { kind: "toggle" } },
        },
      },
    },
    countdowns: {
      label: "カウントダウン",
      control: { kind: "custom", component: CountdownListField },
    },
  }),

  defineGroup("ui", "時限表", periodTableSetting, {
    periods: {
      label: "各時限の時刻",
      description: "時計の時限表示と時間割の両方が使います",
      control: { kind: "custom", component: PeriodTableField },
    },
  }),

  defineGroup("ui", "ロゴ", menuLogoSetting, {
    hidden: {
      label: "上部メニューのロゴを非表示にする",
      control: { kind: "toggle" },
    },
  }),

  defineGroup("ui", "ヒントボタン", uiFloatingHintSetting, {
    hidden: {
      label: "右下のヒント（？）ボタンを非表示にする",
      control: { kind: "toggle" },
    },
  }),

  defineGroup("ui", "クイックドロワー", uiQuickDrawerSetting, {
    hidden: {
      label: "右のブロックドロワーを完全に非表示にする",
      control: { kind: "toggle" },
    },
    pinned: {
      label: "ピン留めするコース",
      description: "ドロワーの最上部に固定表示するコースを選択",
      control: { kind: "custom", component: PinnedCoursesField },
    },
  }),

  defineGroup("ui", "ログイン直後ページ", uiLandingPageSetting, {
    enabled: {
      label: "ログイン直後に指定ページへ自動遷移する",
      control: { kind: "toggle" },
    },
    url: {
      label: "遷移先 URL",
      description: "マイコースやよく開くコースの URL",
      control: {
        kind: "text",
        placeholder: "https://lms-m41.mie-u.ac.jp/my/courses.php",
      },
    },
  }),

  defineGroup("ui", "カスタムフォント", uiFontSetting, {
    enabled: {
      label: "指定したフォントを適用する",
      control: { kind: "toggle" },
    },
    family: {
      label: "フォントファミリー名",
      description: "PCにインストール済みのフォント名",
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

  // --- Home ---
  defineGroup("home", "不要な要素の非表示", homeHideElementsSetting, {
    announcements: { label: "お知らせを隠す", control: { kind: "toggle" } },
    categories: { label: "コースカテゴリを隠す", control: { kind: "toggle" } },
    search: { label: "コース検索を隠す", control: { kind: "toggle" } },
  }),

  defineGroup("home", "気さくな挨拶", homeGreetingSetting, {
    enabled: {
      label: "ホーム上部に挨拶メッセージを表示する",
      control: { kind: "toggle" },
    },
    messages: {
      label: "メッセージ候補",
      description: "ランダムに選ばれる挨拶文のリスト",
      control: { kind: "custom", component: GreetingMessagesField },
    },
  }),

  defineGroup(
    "home",
    "時間割カレンダー",
    timetableSetting,
    {
      enabled: { label: "時間割を表示する", control: { kind: "toggle" } },
      startDate: { label: "学期の開始日", control: { kind: "date" } },
      lessonCount: {
        label: "授業の回数",
        description: "1コマあたり何回で終わるか",
        control: { kind: "number", min: 1, max: 30, unit: "回" },
      },
      grid: {
        label: "時間割コマ",
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
      color: {
        label: "カレンダー配色",
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

  // --- MyCourses ---
  defineGroup("myCourses", "マイコース並び替え", myCoursesTodayOrderSetting, {
    enabled: {
      label: "今日の授業があるコースを最上部に並べる",
      description: "時間割カレンダーと連動して今日のコマのコースを優先表示します",
      control: { kind: "toggle" },
    },
  }),

  // --- CoursePage ---
  defineGroup("coursePage", "セクション順序", coursePageReverseSectionsSetting, {
    enabled: {
      label: "最新の回（セクション）を一番上に表示する",
      control: { kind: "toggle" },
    },
  }),

  defineGroup(
    "coursePage",
    "出席統計の常時表示",
    coursePageAutoattendStatsSetting,
    {
      enabled: {
        label: "出席率・出席回数をコース上部に常時表示する",
        control: { kind: "toggle" },
      },
    },
  ),

  defineGroup("coursePage", "評定インライン表示", coursePageGradeInlineSetting, {
    enabled: {
      label: "各課題の横に得点とフィードバックを埋め込み表示する",
      control: { kind: "toggle" },
    },
  }),

  defineGroup(
    "coursePage",
    "出欠確認ボタン",
    coursePageAutoattendButtonSetting,
    {
      enabled: {
        label: "出欠確認ボタンを目立つ位置に表示する",
        control: { kind: "toggle" },
      },
      placement: {
        label: "配置場所",
        control: {
          kind: "select",
          options: [
            { value: "top", label: "コース最上部" },
            { value: "floating", label: "画面右下の固定ボタン" },
          ],
        },
      },
    },
  ),

  defineGroup("coursePage", "セクション書き出し", coursePageExportSetting, {
    enabled: {
      label: "セクション内容の書き出しボタンを表示する",
      control: { kind: "toggle" },
    },
    format: {
      label: "書き出し形式",
      control: {
        kind: "select",
        options: [
          { value: "markdown", label: "Markdown (.md)" },
          { value: "text", label: "プレーンテキスト (.txt)" },
        ],
      },
    },
  }),
];
