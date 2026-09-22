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

export type TimetableColor = "white" | "black" | "sky" | "pink" | "green";

export interface TimetableConfig {
  enabled: boolean;
  startDate: string; // 学期の開始日 "YYYY-MM-DD"
  lessonCount: number; // 1コマあたりの授業回数
  grid: Record<Weekday, (TimetableSlot | null)[]>; // 時限の順に並べる
  holidays: TimetableHoliday[];
  substitutes: TimetableSubstitute[];
  color: TimetableColor;
}
