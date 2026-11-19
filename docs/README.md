# docs

mi-mo の仕様と実装方針の正典。

## 構成

| ディレクトリ | 内容 | 読む人 |
|---|---|---|
| [`features/`](./features/) | 機能仕様書。ユーザーから見て何ができるか | 機能を検討する人 |
| [`impl/`](./impl/) | 実装指示書。どう作るか | 実装する人 |
| [`moodle/`](./moodle/) | Moodle 実画面から採取したDOM構造・セレクタ | 実装する人 |

| ファイル | 内容 | 読む場面 |
|---|---|---|
| [`ui-principles.md`](./ui-principles.md) | 画面と文言を作る時の判断の軸 | 画面を作る前。文言を書く前 |
| [`browsers.md`](./browsers.md) | Chrome と Firefox で動きが違う点と、その手当て | ブラウザの API・保存・ポップアップを触る前。ブラウザで動きが分かれた時 |
| [`known-issues.md`](./known-issues.md) | 実装済みの機能に残っている課題と、実機で未確認の項目 | 直すものを探す時。不具合を見つけた時 |
| [`verify.md`](./verify.md) | 変更を終える前に行う確認の手順 | 作業を終える前 |
| [`release.md`](./release.md) | 版の番号の付け方と、ストアへ出すまでの手順。ストアへ写す文の置き場所 | リリースする時。権限や機能を足して、ストアの説明と食い違った時 |

AIエージェントのメモの保存先は、[AGENTS.md](../AGENTS.md) の配置ルールに従う。

## 読む順序

やりたいことから、読む文書を決める。

| やりたいこと | 読む順 |
|---|---|
| 新しく機能を作る | [`impl/README.md`](./impl/README.md) の規約と「モジュール一覧と関連」→ [`features/`](./features/) の仕様書 → [`moodle/`](./moodle/) の DOM 資料 → 指示書を書いてから実装 |
| 既にある機能を直す | [`impl/README.md`](./impl/README.md) の「モジュール一覧と関連」から指示書を引く → 指示書の「対象ファイル」に挙がったコード |
| 画面や文言を作る・直す | [`ui-principles.md`](./ui-principles.md) → 該当する指示書 |
| 設定項目を足す | [`ui-principles.md`](./ui-principles.md) → [`impl/utils/settings.md`](./impl/utils/settings.md) → [`impl/settings/panel.md`](./impl/settings/panel.md) の「項目を足す時の規約」 |
| 不具合を直す・課題を選ぶ | [`known-issues.md`](./known-issues.md) → 該当する指示書 |
| 作業を終える | [`verify.md`](./verify.md) |

指示書と実装が食い違っていた場合は、どちらが意図かを決めてから片方を直す。黙って実装だけを変えない。

## 実装状況について

機能が実装済みかどうかは、リポジトリ直下の [README.md](../README.md) の機能一覧にのみ記載する。この docs 配下には書かない。二重管理を避けるため。

実装済みの機能に残る課題は [`known-issues.md`](./known-issues.md) にだけ書く。機能の有無と、機能の出来とを別の場所で管理する。
