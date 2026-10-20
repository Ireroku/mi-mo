import { DOWNLOAD_MESSAGE_TYPE, type DownloadMessage } from "@/utils/download";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: unknown) => {
    if (!message || typeof message !== "object") {
      return;
    }

    const msg = message as Partial<DownloadMessage>;
    if (msg.type !== DOWNLOAD_MESSAGE_TYPE || !Array.isArray(msg.items)) {
      return;
    }

    for (const item of msg.items) {
      if (!item || typeof item.url !== "string") {
        continue;
      }

      browser.downloads.download({
        url: item.url,
        filename: item.filename,
      });
    }
  });
});
