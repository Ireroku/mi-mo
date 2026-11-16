// 保存するファイルやフォルダの名前を整える。

/**
 * ファイル名に使えない文字を `-` へ置き換える。
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, "-").trim();
}
