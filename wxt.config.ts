import { fileURLToPath } from 'node:url';
import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

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
  // WXT の既定では Firefox だけ MV2 になる。両方を MV3 にそろえる
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    // wxt/utils/storage が browser.storage.local を使う。WXT は自動検出しない
    // downloads API は background で使用
    permissions: ['storage', 'downloads'],
    // Chrome はこの項目を知らないと警告するため、Firefox の時だけ付ける
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          // 公開後は変えられない
          id: '{0800c2fa-d768-4bdb-818c-2f169fa6cd93}',
          // MV3 のサイトへのアクセス権限が、インストールの時に許可されるのは 127 から。128 は ESR
          strict_min_version: '128.0',
          // 利用者のデータを集めない。store/privacy.md と対になる
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
  }),
});
