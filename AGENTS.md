# AGENTS.md

AIエージェント向けの入口。規約と導線だけをここに置く。仕様と実装方針は [docs/](./docs/README.md) が正典で、ここへ要約を写さない。

# INFO

## 何を作っているか

`mi-mo` は、三重大学（ユーザの所属大学）の Learning Management System である Moodle 4.5 の UI を変更するブラウザ拡張機能。対象のサイトは `lms-m41.mie-u.ac.jp` で、サイト名は「三重大学 Moodle 4」。非公式のソフトウェアで、三重大学・Moodle HQ とは関係がない。

## Stacks

- pnpm
- WXT（`src/entrypoints/` のファイル名から manifest を生成する）
- Svelte 5 + TypeScript
- Tailwind CSS v4 + shadcn-svelte

## 対象の環境

OS: macOS, Windows
ブラウザ: Firefox, Safari, Chromium

## 最初に読むもの

| 知りたいこと | 読む場所 |
|---|---|
| どの文書をどの順で読むか | [docs/README.md](./docs/README.md) の「読む順序」 |
| 命名・構成・書式の規約、既にあるモジュールの一覧 | [docs/impl/README.md](./docs/impl/README.md)。**実装の前に必ず読む** |
| 画面と文言をどういう考えで作るか | [docs/ui-principles.md](./docs/ui-principles.md)。**画面や文言を作る前に必ず読む** |
| 機能の一覧と、実装済みかどうか | [README.md](./README.md)。実装状況はここにだけ書く |
| 機能がユーザーから見て何をするか | [docs/features/](./docs/features/) |
| モジュールをどう作るか | [docs/impl/](./docs/impl/) |
| Moodle の DOM 構造とセレクタ | [docs/moodle/](./docs/moodle/README.md) |
| 残っている課題、実機で未確認の項目 | [docs/known-issues.md](./docs/known-issues.md) |
| 作業を終える前の確認 | [docs/verify.md](./docs/verify.md) |

既にあるものを再実装しないため、新しくモジュールを作る前に [docs/impl/README.md](./docs/impl/README.md) の「モジュール一覧と関連」を見る。

## コマンド

```sh
pnpm install          # 依存解決
pnpm dev              # Chrome 向けの開発実行
pnpm dev:firefox      # Firefox 向けの開発実行
pnpm build            # Chrome 向けのビルド
pnpm build:firefox    # Firefox 向けのビルド
pnpm zip              # Chrome 向けのパッケージ作成
pnpm zip:firefox      # Firefox 向けのパッケージ作成
pnpm check            # svelte-check による型と構文の検査
pnpm test             # Vitest による単体テスト
pnpm harness          # 設定画面を普通のページとして開くための開発用ページを作る

python3 scripts/checkdocs.py   # docs の文体規約とリンク切れの検査
```

単体テストの対象は純粋な計算（`*.logic.ts` と `src/utils/`）に限る。置き方は [実装規約](./docs/impl/README.md#単体テスト) にある。作業を終える前の確認は [docs/verify.md](./docs/verify.md) に従う。

# RULES

以下のルールは、実際にユーザがオンラインで指示を変更する場合は無視できますが、それ以外の場合は守ってください。

## DO NOT DO...

- コミットは適当な単位でやって欲しいです。PushはしなくてOKです！
- 実機で確認していないものを、確認したことにしないでください。確認できなかった項目は [docs/known-issues.md](./docs/known-issues.md) へ足してください

## FOLLOW TO...

- コードの書式は [実装規約](./docs/impl/README.md#コードの書式) に従ってください。
- 作業を終える前に [検証の手順](./docs/verify.md) の「1. 機械的な検査」を通してください。
- 実装と指示書（`docs/impl/`）は同じ変更の中で揃えてください。食い違いを見つけた場合は、どちらが意図かを決めてから片方を直してください。
- AIエージェントが作る調査メモ・作業計画・設計案・進捗記録・一時ファイルは、Gitの追跡対象外である [`docs/AGENTS/`](./docs/AGENTS/) に保存してください。スキルが別の保存先を指定する場合もこの配置を優先し、用途ごとにサブディレクトリを作ってください。正式な機能仕様・実装指示・Moodle資料は、引き続き [docsの構成](./docs/README.md) に従って管理してください。
- ユーザの要望を完璧に実装する必要はありません。実装しやすくコードが短く済む方法があれば、それを提案しつつコードのシンプルさとユーザの要望のバランスを取る点を探してください

## INFO

- ユーザはあまり賢くないので、面倒を見てやってください