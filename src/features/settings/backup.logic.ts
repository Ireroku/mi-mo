// 設定のバックアップファイルを組み立て、読み込んだファイルから取り込む値を選ぶ。

export const BACKUP_FILENAME = "mi-mo-settings.json";

const APP_NAME = "mi-mo";
const VERSION = 1;

type Values = Record<string, Record<string, unknown>>;

export interface BackupFile {
  app: typeof APP_NAME;
  version: number;
  settings: Values;
}

export function buildBackup(values: Values): BackupFile {
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
export function parseBackup(text: string, current: Values): Values {
  const file: unknown = JSON.parse(text);
  if (!isRecord(file) || file.app !== APP_NAME || !isRecord(file.settings)) {
    throw new Error("mi-mo のバックアップではありません");
  }

  const restored: Values = {};
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
