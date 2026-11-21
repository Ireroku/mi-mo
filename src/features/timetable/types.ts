// 時間割カレンダーの設定とデータ構造の型定義。

// 月曜から金曜の順に並べる。曜日を回す処理と画面の並びはこの順に従う
export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri"] as const;

export type Weekday = (typeof WEEKDAYS)[number];

// 画面に出す曜日の1文字。「曜日」「曜の授業」などは使う側で足す
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "月",
  tue: "火",
  wed: "水",
  thu: "木",
  fri: "金",
};

export interface TimetableSlot {
  title: string;
  url?: string;
}

export interface TimetableHoliday {
  date: string; // "YYYY-MM-DD"
  label?: string;
}

export interface TimetableSubstitute {
  date: string; // "YYYY-MM-DD"
  weekday: Weekday; // この日に行う授業の曜日
}

export type TimetableColor = "moodle" | "white" | "black" | "sky" | "pink" | "green";

export interface TimetableConfig {
  enabled: boolean;
  startDate: string; // 学期の開始日 "YYYY-MM-DD"
  lessonCount: number; // 1コマあたりの授業回数
  grid: Record<Weekday, (TimetableSlot | null)[]>; // 時限の順に並べる
  holidays: TimetableHoliday[];
  substitutes: TimetableSubstitute[];
  color: TimetableColor;
  // 上部メニューの時限のカウントダウンで、授業のある時限だけを数える。この項目が増える前に保存された設定には無く、無ければ合わせる
  syncCountdown?: boolean;
}
