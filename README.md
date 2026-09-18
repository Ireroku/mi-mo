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

開発中に実験的に実行するには次のようにします。  
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
- UI
  - [ ] シームレスに統合された拡張機能設定ボタン
  - [ ] 上部メニュー要素の削除・追加
    - [x] 時計の追加（PC表示のみ対応、モバイルドロワーは未対応。時刻・日付・曜日・時限の表示可否や秒表示は`src/features/menu/index.ts`内のコード設定で切替、GUI設定は未対応）
    - [x] 設定可能な定期試験までの残り時間カウントダウン（汎用カウントダウン機能として実装、複数個配置可能。対象は`index.ts`でコード内設定、GUI設定は未対応。PC表示のみ対応）
      - [x] 何日前から時間表示にし、何時間前から分刻み・秒刻みにするか任意に設定可能（15分/24時間/7日を境に秒・分・日+時間・日数の4段階で自動切替。閾値は現状固定値）
    - [ ] ロゴの非表示
  - [ ] フローティングヒントボタンの削除
  - [ ] モダンな通知ウィンドウUI
  - [ ] 右側のクイックドロワー
    - [ ] 削除可能に
    - [ ] 任意のコースのピン留め
  - [ ] ログイン後に初めに表示するページを設定可能に
  - [ ] 任意のフォントを読み出し設定可能に

- ホーム
  - [ ] 未ログイン時にログインコンポーネントを表示
  - [ ] 最終ログイン時刻の表示
  - [ ] 気さくな挨拶
    - [ ] ユーザ名を常に表示
  - [ ] 一言コメント
  - [ ] 時間割カレンダー
    - [ ] 自由に設定可能な時間割
    - [ ] クリック先のリンク設定（コースページ等に設定）
    - [ ] `.ics` でのエクスポート
    - [ ] 変則的な予定の一括設定
      - [ ] 休みの設定
      - [ ] 休みの代替日の入れ替え設定
    - [ ] 授業の週の表示
      - [ ] 代替日があっても正しく授業の回数を表示
    - [ ] 設定可能な色（白、黒、水色、ピンク、緑）
    - [ ] ダークモード対応
  - [ ] 不要な要素の非表示化
    - [ ] お知らせ
    - [ ] コースカテゴリ
    - [ ] コース検索

- マイコース
  - [ ] カレンダーと同期して「今日の授業順」で表示
  - [ ] コース要素全体のどこをクリックしてもコースページが開くように改善
  - [ ] Enter キー不要のインクリメンタル検索

- コースページ
  - [ ] よりモダンなパンくずリスト
  - [ ] コースセクションの一括開閉ボタンのデザインを美しく
  - [ ] コースインデックスの一括開閉ボタンをトグルに変更
  - [ ] コースと評定を一括表示可能に
  - [ ] コースセクションのタイトルがリンクであることを強調
  - [ ] autoattend による出席リンクをボタンにし、コースの最上部またはフローティングUIに変更可能に
  - [ ] autoattend の出席数と現在の出席率を常時表示
  - [ ] コースセクションの要素を Markdown / テキストでダウンロード（一括ダウンロード）
  - [ ] コースセクションの PDF 等のファイルを一括ダウンロード
  - [ ] コースセクションの順序を逆転して表示

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
