import { fileURLToPath } from 'node:url';
import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
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
  manifest: {
    // wxt/utils/storage が browser.storage.local を使う。WXT は自動検出しない
    // downloads API は background で使用
    permissions: ['storage', 'downloads'],
  },
});
