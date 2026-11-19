// 設定画面で、読み込むファイルを選ばせる窓口。
// Firefox のポップアップはファイル選択のダイアログを開くと閉じ、選んだファイルを受け取れないため、オプション画面へ移す。
// ファイル選択はクリックの直後にしか開けないため、移った先では読み込みのボタンを示し、もう一度押してもらう。

// オプション画面のアドレスに付ける印。ポップアップから移ってきたことを表す
const PICK_PARAM = "pick";

const PICK_HINT = "ここからファイルを選んでください";

// 読み込んだ時点で決める。パネルが開いている場所を hash へ写す時にアドレスの印は消え、ボタンを1つ示したらこちらも下ろす
let pickRequested = new URLSearchParams(location.search).has(PICK_PARAM);

/**
 * ファイル選択を開く。Firefox のポップアップの中では、代わりにオプション画面をタブで開いてポップアップを閉じる。
 * 開いている場所（hash）を引き継ぎ、同じ画面を出す。
 */
export function openFilePicker(input: HTMLInputElement): void {
  if (import.meta.env.FIREFOX && location.pathname.endsWith("/popup.html")) {
    const url = `${browser.runtime.getURL("/options.html")}?${PICK_PARAM}${location.hash}`;
    void browser.tabs.create({ url });
    window.close();
    return;
  }
  input.click();
}

/**
 * 読み込みのボタンに付ける。ポップアップから移ってきた時だけ、見えているボタンを画面の中ほどへ出し、
 * フォーカスの輪で示して、案内の文言を showHint で出させる。隠れたタブの中のボタンは示さない。
 */
export function pickTarget(showHint: (text: string) => void) {
  return (node: HTMLElement): void => {
    if (!pickRequested || !node.checkVisibility()) {
      return;
    }
    node.scrollIntoView({ block: "center" });
    // スクリプトから当てたフォーカスには、そのままでは輪が出ない。輪で押す場所を示す。
    // focusVisible は Firefox が対応し、TypeScript の型にはまだ無い。ここを通るのは Firefox だけ
    node.focus({ focusVisible: true } as FocusOptions);
    pickRequested = false;
    showHint(PICK_HINT);
  };
}
