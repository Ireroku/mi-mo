import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    // wxt/utils/storage が browser.storage.local を使う。WXT は自動検出しない
    permissions: ['storage'],
  },
});
