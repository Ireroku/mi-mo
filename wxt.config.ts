import { fileURLToPath } from 'node:url';
import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

// ツールバーのアイコンの絵は 16×16 のマス目なので、整数倍だけを作る
const toolbarIconSizes = [16, 32];

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte', '@wxt-dev/auto-icons'],
  // 元の絵1枚から、ビルドのたびに各サイズの PNG を作る。開発版は灰色になる
  autoIcons: {
    // 絵は 16×16 のマス目の内側 12×12 に収める。128px で周りに 16px の余白が空き、
    // Chrome Web Store のガイドライン（絵は 96×96、余白は 16px）に沿う
    baseIconPath: 'assets/icon.svg',
    // 96 は Firefox の高解像度の画面で使う。1.1.2 はここの値を既定へ足すが、未公開の次の版では置き換える。
    // どちらでも同じ結果になるよう、すべて書く
    sizes: [128, 96, 48, 32, 16],
  },
  hooks: {
    // 自分のモジュールは import を書いて使う（docs/impl/README.md の「import の書き方」）。
    // WXT は既定で src/utils などの export をすべて auto-import へ載せる。
    // imports.dirs は既定と連結されて空にできないため、決まった後で空にする
    'config:resolved': (wxt) => {
      wxt.config.imports.dirs = [];
    },
    // WXT は cssInjectionMode: "ui" の CSS へ use_dynamic_url を付けるが、Firefox はこの項目を知らず警告する。
    // Firefox は moz-extension:// の UUID がインストールごとに違うため、付けなくても同じ働きになる
    'build:manifestGenerated': (wxt, manifest) => {
      if (wxt.config.browser !== 'firefox') return;
      for (const entry of manifest.web_accessible_resources ?? []) {
        if (typeof entry === 'object') delete entry.use_dynamic_url;
      }
    },
    // ツールバーのアイコンは別の絵にする。上の余白付きの絵は、16px の欄では細く小さく見える
    'build:done': async (wxt, output) => {
      for (const size of toolbarIconSizes) {
        const image = sharp(resolve(wxt.config.srcDir, 'assets/icon-toolbar.svg')).resize(size).png();
        // auto-icons にそろえ、開発版は灰色にする
        if (wxt.config.mode === 'development') image.grayscale();
        const fileName = `icons/toolbar-${size}.png`;
        await mkdir(resolve(wxt.config.outDir, 'icons'), { recursive: true });
        await image.toFile(resolve(wxt.config.outDir, fileName));
        output.publicAssets.push({ type: 'asset', fileName });
      }
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      // tsconfig.json の paths と対になる。shadcn のコンポーネントが $lib を使う
      alias: {
        $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
      },
    },
  }),
  // pnpm dev でブラウザを立ち上げない。.output/chrome-mv3-dev を自分の Chrome へ一度読み込めば、
  // dev サーバーが動いている間は保存するたびに読み直される。手順は docs/verify.md にある。
  // WXT 0.21 は web-ext.config.ts の disabled を見ないため、ここに書く
  webExt: { disabled: true },
  // Firefox の審査に添える sources の ZIP へは、ビルドに使うものだけを入れる。
  // WXT は .gitignore を見ないため、手元で作ると docs/AGENTS/ の作業メモまで入る
  zip: {
    excludeSources: ['AGENTS.md', 'CLAUDE.md', 'docs/**', 'store/**', 'scripts/**'],
  },
  // WXT の既定では Firefox だけ MV2 になる。両方を MV3 にそろえる
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    // wxt/utils/storage が browser.storage.local を使う。WXT は自動検出しない
    // downloads API は background で使用
    permissions: ['storage', 'downloads'],
    // 32 は高解像度の画面で使う
    action: {
      default_icon: Object.fromEntries(toolbarIconSizes.map((size) => [size, `icons/toolbar-${size}.png`])),
    },
    // Chrome はこの項目を知らないと警告するため、Firefox の時だけ付ける
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          // 公開後は変えられない
          id: '{0800c2fa-d768-4bdb-818c-2f169fa6cd93}',
          // サポートが続いている ESR に合わせる。下の data_collection_permissions は 140 から（Android は 142 から）。
          // gecko_android を書かないと、Android にもこの値が使われる
          strict_min_version: '153.0',
          // 利用者のデータを集めない。store/privacy.md と対になる
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
  }),
});
