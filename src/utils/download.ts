// content script からファイルの保存を依頼する窓口。
// downloads API は background で実行するため、メッセージで依頼を送る。

export const DOWNLOAD_MESSAGE_TYPE = "mimo:download";

export interface DownloadItem {
  url: string;
  filename?: string;
}

export interface DownloadMessage {
  type: typeof DOWNLOAD_MESSAGE_TYPE;
  items: DownloadItem[];
}

/**
 * ファイルの保存を background へ依頼する。
 * items が空なら何もせず戻る。送信が済んだ時点で解決し、保存の完了は待たない。
 */
export function requestDownloads(items: DownloadItem[]): Promise<void> {
  if (items.length === 0) {
    return Promise.resolve();
  }

  const message: DownloadMessage = {
    type: DOWNLOAD_MESSAGE_TYPE,
    items,
  };

  browser.runtime.sendMessage(message);
  return Promise.resolve();
}

/**
 * テキストを data: URL に変換する。
 */
export function toTextDataUrl(text: string, mimeType: string): string {
  const encoded = encodeURIComponent(text);
  return `data:${mimeType};charset=utf-8,${encoded}`;
}
