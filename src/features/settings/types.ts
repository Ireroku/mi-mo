// 設定画面のメタデータ型定義と、ストレージ項目を結び付ける defineGroup 関数。

import type { Component } from "svelte";
import type { WxtStorageItem } from "wxt/utils/storage";

export type SettingsCategory = "home" | "course" | "general";

export interface SelectOption<V extends string = string> {
  value: V;
  label: string;
}

export interface CustomFieldProps<V> {
  value: V;
  onChange: (next: V) => void;
}

export type FieldControl<V> =
  | { kind: "toggle" }
  | { kind: "number"; min: number; max: number; step?: number; unit?: string }
  | { kind: "text"; placeholder?: string }
  | { kind: "date" }
  | {
      kind: "select";
      options: readonly SelectOption<[V] extends [string] ? V : string>[];
    }
  | { kind: "nested"; fields: FieldsOf<V> }
  | {
      kind: "custom";
      component: Component<CustomFieldProps<V>>;
      // 別の画面を閉じる時に値を整える。書きかけで空のまま残った行を消すのに使う
      prune?: (value: V) => V;
      // 別の画面の残りの高さに収め、はみ出す分は部品の中でスクロールさせる
      fill?: boolean;
    };

export interface FieldMeta<V = unknown, C = unknown> {
  label: string;
  description?: string;
  section?: string; // この行を置くカードの見出し。省くとグループの title になる
  control: FieldControl<V>;
  // グループの今の値を受け取り、false の間は行を出さない。省くと常に出す
  when?(config: C): boolean;
}

export type FieldsOf<C> = { [K in keyof C]-?: FieldMeta<C[K], C> };

export interface SettingsGroup {
  readonly id: string;
  category: SettingsCategory;
  title: string;
  fields: Record<string, FieldMeta>;
  footer?: Component<FooterProps>;
  after?: string; // 行の id（`<グループの id>.<キー>`）。その行の直後へ、このグループの行を差し込む
  read: () => Promise<Record<string, unknown>>;
  write: (key: string, value: unknown) => Promise<void>;
  replace: (value: Record<string, unknown>) => Promise<void>;
}

// footer が受け取る、全グループの今の値と、値を取り込む手段
export interface FooterProps {
  values: Record<string, Record<string, unknown>>;
  onRestore: (values: Record<string, Record<string, unknown>>) => Promise<void>;
}

export interface GroupOptions<C = Record<string, unknown>> {
  footer?: Component<FooterProps>;
  after?: string;
  // 外から読み込んだ値（バックアップやファイル）を、保存の前に今の形へ揃える
  normalize?: (value: C) => C;
}

export function rowId(groupId: string, key: string): string {
  return `${groupId}.${key}`;
}

/**
 * 1つの保存項目を、読んでから書き終えるまで他の書き込みと重ならないように扱う。
 * ポップアップとオプション画面を同時に開いても、間に他方の書き込みが挟まらない。
 * ロックは同じオリジンの拡張機能のページ同士で共有される。
 */
export async function withSettingLock(
  key: string,
  task: () => Promise<void>,
): Promise<void> {
  await navigator.locks.request(`mi-mo-settings:${key}`, task);
}

export function defineGroup<C extends object>(
  category: SettingsCategory,
  title: string,
  setting: WxtStorageItem<C, Record<string, unknown>>,
  fields: FieldsOf<C>,
  { normalize = (value) => value, ...options }: GroupOptions<C> = {},
): SettingsGroup {
  const erasedFields = fields as unknown as Record<string, FieldMeta>;
  // 項目が後から増えた設定では、保存済みの値に新しいキーが無い。既定値で埋めて返す
  const read = async () =>
    ({
      ...setting.fallback,
      ...(await setting.getValue()),
    }) as Record<string, unknown>;
  const exclusive = (task: () => Promise<void>) => withSettingLock(setting.key, task);
  const write = (key: string, value: unknown) =>
    exclusive(async () => {
      const current = await setting.getValue();
      await setting.setValue({
        ...current,
        [key]: value,
      } as C);
    });

  return {
    id: setting.key,
    category,
    title,
    fields: erasedFields,
    ...options,
    read,
    write,
    replace: (value) => exclusive(() => setting.setValue(normalize(value as C))),
  };
}

export const CATEGORY_LABELS: Record<SettingsCategory, string> = {
  home: "ホーム",
  course: "コース",
  general: "全体",
};
