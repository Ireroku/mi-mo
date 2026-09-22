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
  manifest: {
    // wxt/utils/storage が browser.storage.local を使う。WXT は自動検出しない
    // downloads API は background で使用
    permissions: ['storage', 'downloads'],
  },
});
