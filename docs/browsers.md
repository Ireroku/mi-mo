# ブラウザごとの違い

Chrome と Firefox で動きが分かれ、実装で手当てした点の一覧。実機で見た差だけを書く。手当ての詳しい手順は各指示書が正典で、ここは入口として違いと参照先だけを置く。

新しく違いを見つけたら、ここへ1行足し、手当てを書いた指示書へリンクする。実機で確かめていない差は [known-issues.md](./known-issues.md) へ書く。

## 一覧

| 場面 | Chrome | Firefox | 手当て | 詳しく |
|---|---|---|---|---|
| オプション画面の開き方 | 既定で拡張機能の管理の中のダイアログへ埋め込み、高さを中身から決める。パネルの `h-dvh` と合わさって高さが 0 になり、中身が出ない | 問題なし | `options/index.html` の `manifest.open_in_tab` でタブで開く | [panel.md](./impl/settings/panel.md) |
| ポップアップでのファイル選択 | 問題なし | ファイル選択のダイアログを開くとポップアップが閉じ、選んだファイルを受け取れない | Firefox のポップアップからはオプション画面をタブで開き、同じ場所の読み込みボタンを示す | [panel.md](./impl/settings/panel.md) |
| `storage` へ渡す値 | Svelte の `$state` の Proxy をそのまま渡しても保存できる | structured clone で写すため Proxy を受け取れず、`DataCloneError: Proxy object could not be cloned` で失敗する。時間割の行が2件目から保存できない、復元が失敗する、という形で現れた | 保存と復元の前に `$state.snapshot` で素の値へ直す | [panel.md](./impl/settings/panel.md) |
| `downloads.download` の保存名 | 転送を追い、`Content-Disposition` から名前を決める | 転送元の URL から名前を決める。資料のリンク（`view.php`）が `view.php` の名前で保存される | 保存の前に `HEAD` で転送先を解決し、名前を添えて渡す | [download.md](./impl/utils/download.md)、[bulkDownload.md](./impl/coursePage/bulkDownload.md) |
| content script で作ったデータの保存 | `data:` の URL を background へ送って保存できる | 同じ形で、送り手に「Promised response from onMessage listener went out of scope」が届き保存されない | content script の中で `saveBlob`（リンクのクリック）で保存する | [download.md](./impl/utils/download.md) |
| `onMessage` のリスナーの応答 | リスナーから返した `Promise` を無視し、送信側へ `undefined` が届く | `Promise` を応答として扱う | 両方で `sendResponse` と `return true` で返す | [download.md](./impl/utils/download.md) |
| `focus({ focusVisible: true })` | 対応せず、スクリプトから当てたフォーカスに輪が出ない | 対応し、輪が出る | Firefox だけが通る経路でだけ使う | [panel.md](./impl/settings/panel.md) |

## 両方に共通する制約

- **ファイル選択はクリックの直後にしか開けない。** タブを開いた後や読み込みの後に、スクリプトから `input.click()` を呼んでも開かない。ポップアップから移った先で自動では開かず、ボタンを示してもう一度押してもらう（[panel.md](./impl/settings/panel.md)）

## 分岐の書き方

ブラウザで処理を分ける時は、ビルド時に決まる `import.meta.env.FIREFOX` を使う。ユーザーエージェントの文字列は見ない。
