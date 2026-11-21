// 設定のバックアップファイルを組み立て、読み込んだファイルから取り込む値を選ぶ。

import type { SettingsValues } from "./types";

export const BACKUP_FILENAME = "mi-mo-settings.json";

const APP_NAME = "mi-mo";
const VERSION = 1;

export interface BackupFile {
  app: typeof APP_NAME;
  version: number;
  settings: SettingsValues;
}

export function buildBackup(values: SettingsValues): BackupFile {
  return { app: APP_NAME, version: VERSION, settings: values };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sameKind(a: unknown, b: unknown): boolean {
  return typeof a === typeof b && Array.isArray(a) === Array.isArray(b);
}

/**
 * バックアップの文字列から、取り込む値をグループごとに返す。
 * 今ある項目と同じ種類の値だけを取り込み、それ以外は今の値を残す。ファイルに無いグループは返さない。
 * mi-mo のバックアップでない場合は例外を投げる。
 */
export function parseBackup(text: string, current: SettingsValues): SettingsValues {
  const file: unknown = JSON.parse(text);
  if (!isRecord(file) || file.app !== APP_NAME || !isRecord(file.settings)) {
    throw new Error("mi-mo のバックアップではありません");
  }

  const restored: SettingsValues = {};
  for (const [id, now] of Object.entries(current)) {
    const saved = file.settings[id];
    if (!isRecord(saved)) {
      continue;
    }

    restored[id] = Object.fromEntries(
      Object.entries(now).map(([key, value]) => [
        key,
        key in saved && sameKind(saved[key], value) ? saved[key] : value,
      ]),
    );
  }
  return restored;
}

// 出し入れする範囲。グループの保存キーと、そのグループの中で対象にするキーの組
export type BackupScope = Readonly<Record<string, readonly string[]>>;

/**
 * 範囲に入るグループとキーだけを残して返す。
 */
export function narrowValues(values: SettingsValues, scope: BackupScope): SettingsValues {
  return Object.fromEntries(
    Object.entries(scope).map(([groupId, keys]) => {
      const group = values[groupId] ?? {};
      return [
        groupId,
        Object.fromEntries(
          keys.filter((key) => key in group).map((key) => [key, group[key]]),
        ),
      ];
    }),
  );
}

/**
 * バックアップの文字列から、範囲に入る値だけを取り込む。
 * 範囲の外のキーは今の値を残し、グループ全体の値にして返す。ファイルに無いグループは返さない。
 * ファイルに範囲のグループが1つも無い場合は例外を投げる。
 */
export function parseScopedBackup(
  text: string,
  current: SettingsValues,
  scope: BackupScope,
): SettingsValues {
  const restored = parseBackup(text, narrowValues(current, scope));
  if (Object.keys(restored).length === 0) {
    throw new Error("このファイルには対象の設定がありません");
  }

  return Object.fromEntries(
    Object.entries(restored).map(([groupId, group]) => [
      groupId,
      { ...current[groupId], ...group },
    ]),
  );
}
