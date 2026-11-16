import {
  DOWNLOAD_MESSAGE_TYPE,
  type DownloadItem,
  type DownloadMessage,
  type DownloadResponse,
} from "@/utils/download";

async function startDownloads(items: DownloadItem[]): Promise<DownloadResponse> {
  const results = await Promise.allSettled(
    items.map((item) =>
      browser.downloads.download({ url: item.url, filename: item.filename }),
    ),
  );

  const failures = results.filter((result) => result.status === "rejected");
  for (const failure of failures) {
    console.error("[mi-mo] download", failure.reason);
  }
  return { failed: failures.length };
}

export default defineBackground(() => {
  // Promise を返すと Firefox では応答になるが Chrome では無視されるため、sendResponse と return true で応答する。
  browser.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse) => {
      if (!message || typeof message !== "object") {
        return;
      }

      const msg = message as Partial<DownloadMessage>;
      if (msg.type !== DOWNLOAD_MESSAGE_TYPE || !Array.isArray(msg.items)) {
        return;
      }

      const items = msg.items.filter(
        (item) => item && typeof item.url === "string",
      );
      startDownloads(items).then(sendResponse);
      return true;
    },
  );
});
