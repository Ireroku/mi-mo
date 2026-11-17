// 時間割カレンダーの設定とデータ構造の型定義。

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri";

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
