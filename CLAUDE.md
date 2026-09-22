# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

`mi-mo` は三重大学の Moodle 4 (`lms-m41.mie-u.ac.jp`) にUI改善機能を追加するブラウザ拡張機能。WXT + Svelte 5 + TypeScript + Tailwind CSS v4 で構築する。Chrome/Firefox/Safari (macOS, Windows) を対象とする。非公式ソフトウェアで、三重大学・Moodle HQとは無関係。

## コマンド

```sh
pnpm install        # 依存解決
pnpm dev             # Chrome向け開発実行 (WXT)
pnpm dev:firefox     # Firefox向け開発実行
pnpm build           # Chrome向けビルド
pnpm build:firefox   # Firefox向けビルド
pnpm zip             # Chrome向けパッケージ作成
pnpm zip:firefox     # Firefox向けパッケージ作成
pnpm check           # svelte-check による型・構文チェック (./tsconfig.json)

python3 scripts/checkdocs.py   # docs の文体規約とリンク切れを検査
```

単体テストのスクリプトは用意していない。

## ドキュメント

仕様と実装方針の正典は [docs/](./docs/README.md) にある。ここに要約を置かず、必ず現物を読む。

| 場所 | 内容 |
|---|---|
| [docs/impl/README.md](./docs/impl/README.md) | **実装前に必ず読む。** 命名規約・アーキテクチャ方針・文体・指示書のテンプレート |
| [docs/impl/](./docs/impl/) | モジュールごとの実装指示書。どう作るか |
| [docs/features/](./docs/features/) | 機能仕様書。ユーザーから見て何ができるか |
| [docs/moodle/](./docs/moodle/) | Moodle 実画面から採取したDOM構造とセレクタ |
| [AGENTS.md](./AGENTS.md) | コーディング規約の正典 |
| [README.md](./README.md) | 機能一覧と実装状況。実装済みかどうかはここにのみ記載する |

新しくモジュールを作る場合は [docs/impl/README.md](./docs/impl/README.md) の「モジュール一覧と関連」を先に見る。既にあるものを再実装しないため。
