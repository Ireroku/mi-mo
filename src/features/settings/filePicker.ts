// 設定画面で、読み込むファイルを選ばせる窓口。
// Firefox のポップアップはファイル選択のダイアログを開くと閉じ、選んだファイルを受け取れないため、オプション画面へ移す。

/**
 * ファイル選択を開く。Firefox のポップアップの中では、代わりにオプション画面をタブで開いてポップアップを閉じる。
 */
export function openFilePicker(input: HTMLInputElement): void {
  if (import.meta.env.FIREFOX && location.pathname.endsWith("/popup.html")) {
    void browser.runtime.openOptionsPage();
    window.close();
    return;
  }
  input.click();
}
