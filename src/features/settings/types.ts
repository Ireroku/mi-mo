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
  | { kind: "custom"; component: Component<CustomFieldProps<V>> };

export interface FieldMeta<V = unknown> {
  label: string;
  description?: string;
  control: FieldControl<V>;
}

export type FieldsOf<C> = { [K in keyof C]-?: FieldMeta<C[K]> };

export interface SettingsGroup {
  readonly id: string;
  category: SettingsCategory;
  title: string;
  fields: Record<string, FieldMeta>;
  footer?: Component;
  read: () => Promise<Record<string, unknown>>;
  write: (key: string, value: unknown) => Promise<void>;
}

export function defineGroup<C extends object>(
  category: SettingsCategory,
  title: string,
  setting: WxtStorageItem<C, Record<string, unknown>>,
  fields: FieldsOf<C>,
  footer?: Component,
): SettingsGroup {
  const erasedFields = fields as unknown as Record<string, FieldMeta>;
  const read = () =>
    setting.getValue() as unknown as Promise<Record<string, unknown>>;
  const write = async (key: string, value: unknown) => {
    const current = await setting.getValue();
    await setting.setValue({
      ...current,
      [key]: value,
    } as C);
  };

  return {
    id: setting.key,
    category,
    title,
    fields: erasedFields,
    footer,
    read,
    write,
  };
}

export const CATEGORY_LABELS: Record<SettingsCategory, string> = {
  home: "ホーム",
  course: "コース",
  general: "全体",
};
