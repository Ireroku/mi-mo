// 保存するファイルやフォルダの名前を整える。
import filenamify from "filenamify/browser";

/**
 * ファイル名に使えない文字を `-` へ置き換え、相対パスや予約名を避けた名前にする。
 */
export function sanitizeFilename(name: string): string {
  return filenamify(name, { replacement: "-", maxLength: 200 }).trim();
}
