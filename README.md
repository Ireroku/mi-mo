# mi-mo

[三重大学 Moodle 4](https://lms-m41.mie-u.ac.jp/) に幾つかの機能を追加するブラウザ拡張機能です。

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Framework: WXT](https://img.shields.io/badge/Framework-WXT-red.svg)
![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

> [!WARNING]
> この拡張機能は非公式のソフトウェアです。[三重大学](https://www.mie-u.ac.jp/)および[Moodle HQ](https://moodle.org)とはいかなる関係もありません。  
> 利用によって生じたどんな不都合や損害も責任を負いかねます。自己責任でご利用ください。  

---

## 🛠️ Build

> [!INFO]  
> Requirements:  
> 
> - [Node.js](https://nodejs.org/) 
> - [pnpm](https://pnpm.io/)


```sh
# 1. Clone
git clone https://github.com/<username>/mi-mo.git
cd mi-mo

# 2. 依存の解決
pnpm install

# 3. ビルド
## (Chrome)
pnpm build

## (Firefox)
pnpm build:firefox

# 4. パッケージの作成
## (Chrome)
pnpm zip

## (Firefox)
pnpm zip:firefox
```

開発中に実験的に実行するには次のようにします。ブラウザは立ち上がらないため、`.output/chrome-mv3-dev` を自分の Chrome へ一度読み込みます（手順は [docs/verify.md](./docs/verify.md#自分の-chrome-で確かめる)）。  
```sh
# Chrome
pnpm dev

# Firefox
pnpm dev:firefox
```

## コントリビューション

プログラミングが不得意なので、Issue、Pull Request等々をいただけると嬉しいです！    
お気軽にどうぞ！

## 🚧 機能一覧・ロードマップ

各機能の詳細は [docs/features/](./docs/features/) にあります。

- UI
  - [x] [拡張機能の設定画面](./docs/features/ui/settings.md)
    - [x] 全機能の一括オン・オフ（実機では未確認）
    - [x] 設定のバックアップ（ファイルへの書き出し・読み込み。実機では未確認）
  - [x] [上部メニュー要素の削除・追加](./docs/features/ui/menu.md)
    - [x] メニュー項目の非表示・追加（モバイル表示は未検証）
    - [x] 時計の追加（PC表示のみ）
    - [x] 設定可能な定期試験までの残り時間カウントダウン（PC表示のみ）
      - [x] 何日前から時間表示にし、何時間前から分刻み・秒刻みにするか任意に設定可能（閾値は固定値）
    - [ ] 狭い画面で入りきらない時計とカウントダウンを、消す代わりに右のクイックドロワーへ移す
    - [x] ロゴの非表示
  - [x] [フローティングヒントボタンの削除](./docs/features/ui/floating-hint.md)
  - [x] [右側のクイックドロワー](./docs/features/ui/quick-drawer.md)
    - [x] 削除可能に
    - [x] 任意のコースのピン留め
  - [x] [ログイン後に初めに表示するページを設定可能に](./docs/features/ui/landing-page.md)
  - [x] [任意のフォントを読み出し設定可能に](./docs/features/ui/font.md)

- ホーム
  - [x] [未ログイン時にログインコンポーネントを表示](./docs/features/home/login-component.md)
  - [x] [気さくな挨拶](./docs/features/home/greeting.md)
    - [x] ユーザ名を常に表示
  - [x] [時間割カレンダー](./docs/features/home/timetable.md)
    - [x] 自由に設定可能な時間割
    - [x] 時限の名前と並べ替え（実機では未確認）
    - [x] クリック先のリンク設定（コースページ等に設定）
    - [x] `.ics` でのエクスポート
    - [x] ファイルでの出し入れ（実機では未確認）
    - [x] 変則的な予定の一括設定
      - [x] 休みの設定
      - [x] 休みの代替日の入れ替え設定
    - [x] 授業の週の表示
      - [x] 代替日があっても正しく授業の回数を表示
    - [x] 設定可能な色（Moodle、白、黒、水色、ピンク、緑。OS のダークモードでも選んだ色のまま）
  - [x] [不要な要素の非表示化](./docs/features/home/hide-elements.md)
    - [x] お知らせ
    - [x] コースカテゴリ
    - [x] コース検索

- マイコース
  - [x] [カレンダーと同期して「今日の授業順」で表示](./docs/features/my-courses/today-order.md)
  - [x] [コース要素全体のどこをクリックしてもコースページが開くように改善](./docs/features/my-courses/clickable-card.md)
  - [x] [即座に絞り込む検索](./docs/features/my-courses/incremental-search.md)

- コースページ
  - [x] [よりモダンなパンくずリスト](./docs/features/course-page/breadcrumb.md)
  - [x] [コースセクションの一括開閉ボタンのデザインを美しく](./docs/features/course-page/section-toggle-design.md)
  - [x] [コースインデックスの一括開閉ボタンをトグルに変更](./docs/features/course-page/index-toggle.md)
  - [x] [コースと評定を一括表示可能に](./docs/features/course-page/grade-inline.md)
  - [x] [コースセクションのタイトルがリンクであることを強調](./docs/features/course-page/section-title-link.md)
  - [x] [autoattend による出席リンクをボタンにし、コースの最上部またはフローティングUIに変更可能に](./docs/features/course-page/autoattend-button.md)
  - [x] [autoattend の出席数と現在の出席率を常時表示](./docs/features/course-page/autoattend-stats.md)
  - [x] [コースセクションの要素を Markdown / テキストでダウンロード（一括ダウンロード）](./docs/features/course-page/export-markdown.md)
  - [x] [コースセクションの PDF 等のファイルを一括ダウンロード](./docs/features/course-page/bulk-download.md)
  - [x] [ページ資料の本文と画像を保存](./docs/features/course-page/page-save.md)
  - [x] [コースセクションの順序を逆転して表示](./docs/features/course-page/reverse-sections.md)

- 配布・ストア公開
  - [ ] Firefox Add-ons ストアへの公開
  - [ ] Chrome Web Store への公開
  - [ ] Safari 向け対応 / 公開（未定）

## 📚 参考リンク

- [MDN: WebExtensions の開発](https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions)
- [WXT: Project Structure](https://wxt.dev/guide/essentials/project-structure.html)
- [lramos33/big-calendar](https://github.com/lramos33/big-calendar)
- [shadcn-svelte](https://github.com/huntabyte/shadcn-svelte)
- [Svelte Tutorial: Inspecting State](https://svelte.jp/tutorial/svelte/inspecting-state)

## ライセンス

[MIT License](./LICENSE)
