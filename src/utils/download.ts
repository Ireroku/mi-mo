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

export interface DownloadResponse {
  failed: number; // 保存を開始できなかった件数
}

/**
 * ファイルの保存を background へ依頼する。
 * items が空なら何もせず戻る。background が保存を開始した時点で解決し、保存の完了は待たない。
 * 開始に失敗した項目があれば reject する。
 */
export async function requestDownloads(items: DownloadItem[]): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const message: DownloadMessage = {
    type: DOWNLOAD_MESSAGE_TYPE,
    items,
  };
  const response: DownloadResponse | undefined =
    await browser.runtime.sendMessage(message);
  if (!response || response.failed > 0) {
    throw new Error(
      `保存を開始できませんでした（${response?.failed ?? items.length}/${items.length} 件）`,
    );
  }
}

/**
 * テキストを data: URL に変換する。
 */
export function toTextDataUrl(text: string, mimeType: string): string {
  const encoded = encodeURIComponent(text);
  return `data:${mimeType};charset=utf-8,${encoded}`;
}
