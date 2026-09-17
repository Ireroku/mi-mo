# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

`mi-mo` は三重大学の Moodle 4 (`lms-m41.mie-u.ac.jp`) にUI改善機能を追加するブラウザ拡張機能。WXT + Svelte 5 + TypeScript + Tailwind CSS v4 で構築されている。Chrome/Firefox/Safari (macOS, Windows) を対象とする。非公式ソフトウェアで、三重大学・Moodle HQとは無関係。

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
```

単体テストのスクリプトは現状用意されていない。

## アーキテクチャ

### WXTのエントリーポイント構造

- `src/entrypoints/` はWXTのファイルベースルーティングで自動的にmanifestへ変換される。ファイル名末尾の `.content` はcontent scriptを表す。
- `src/entrypoints/shared.content.ts` — Moodleサイト全体で読み込む共通content script。
- `src/entrypoints/popup/` — 拡張機能のツールバーポップアップ（Svelte + Vite標準構成）。

### 機能はentrypointsではなくfeaturesに実装する

UIロジックはentrypoint本体には書かず、`src/features/<feature名>/` 以下に実装し、entrypointからimportして呼び出す。entrypointは薄い設定・初期化のみを担当する（`src/features/menu/index.ts` を `shared.content.ts` から呼び出す形が現状の主パターン）。

`*.logic.ts` / `*.svelte` のペア命名規則がある（例: `clock.logic.ts` + `clock.svelte`）。ロジックをSvelteコンポーネントから分離する意図。

### Moodle DOM操作はAdapterパターンで抽象化する

`src/features/menu/navbar/` が参考実装。Moodle側のDOM構造（PC表示のトップバー `nav.navbar` とモバイル表示のドロワー `#theme_boost-drawers-primary` はマークアップが異なる）を `MenuAdapter` インターフェース (`types.ts`) の下に隠し、`MenuManager` が両アダプター (`NavbarAdapter` in `primaryNav.dom.ts`, `DrawerAdapter` in `drawer.dom.ts`) へ同じ操作（`hideItem` / `insertItem`）をブロードキャストする。

新しくMoodleのDOMを操作する機能を追加する場合は、同様に「宣言的な設定オブジェクトを受け取るManager」+「DOM構造ごとのAdapter」の形に分離する。Moodle実画面のDOM構造・セレクタは各機能ディレクトリの `*.md`（例: `navbar/menu.md`）に採取して残す慣習がある。

### パスエイリアス

- `$lib` → `src/lib`（`vite.config.js` と `tsconfig.json` で定義）。`src/lib` はshadcn-svelteなどが自動生成するコンポーネント／フック用で、手動でのファイル作成は基本的に想定されていない（`components.json` のaliases設定も参照）。

### スタイリング

Tailwind CSS v4 (`@tailwindcss/vite`)。グローバルCSSは `src/assets/global.css`。shadcn-svelte導入済み（`components.json`: style=rhea, iconLibrary=lucide）。

## コーディング規約（AGENTS.mdより）

- DRY > KISS >> YAGNI の優先度。ただし原則を守ることで可読性が下がる場合は原則より可読性を優先する。
- 既存の言語仕様・ライブラリ機能に責務を委譲できる場合はそちらを優先し、車輪の再発明を避ける。
- ライブラリ利用時はバージョン（メジャー/マイナー）による構文差異に注意する。
- 用意されたファイル閲覧・編集ツールを使用し、`cat` や `python` 等での直接操作は行わない。
- Git操作は慎重に。ユーザーから明示的な許可がない限り、操作の実行よりユーザーへの提案を優先する。
- コードレビューやverifyに二度失敗した場合は中断してユーザーに状況を報告する。
- 調査用スクリプトを作成・実行する場合は、無言で使わずその意図と使い道をユーザーに申告する。
