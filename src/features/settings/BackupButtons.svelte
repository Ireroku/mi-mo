<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Download, Upload } from "@lucide/svelte";
  import { saveBlob } from "@/utils/download";
  import ConfirmDialog from "./controls/ConfirmDialog.svelte";
  import type { BackupScope } from "./backup.logic";
  import {
    BACKUP_FILENAME,
    buildBackup,
    narrowValues,
    parseBackup,
    parseScopedBackup,
  } from "./backup.logic";

  type Values = Record<string, Record<string, unknown>>;

  interface Props {
    values: Values;
    onRestore: (values: Values) => Promise<void>;
    filename?: string;
    scope?: BackupScope; // 省くと、すべての設定を出し入れする
    noun?: string; // 結果の文言で、読み込んだものを指す名前
  }

  let {
    values,
    onRestore,
    filename = BACKUP_FILENAME,
    scope,
    noun = "設定",
  }: Props = $props();

  let fileInput: HTMLInputElement;
  let message = $state<{ text: string; failed: boolean } | null>(null);
  // 読み込んだファイルの値。確認で「読み込む」を押すまで反映しない
  let pending = $state<Values | null>(null);
  let confirming = $state(false);

  function handleExport() {
    const target = scope ? narrowValues(values, scope) : values;
    const json = JSON.stringify(buildBackup(target), null, 2);
    saveBlob(new Blob([json], { type: "application/json" }), filename);
  }

  async function handleFile() {
    const file = fileInput.files?.[0];
    // 同じファイルをもう一度選んでも change が起きるよう、選択を空へ戻す
    fileInput.value = "";
    if (!file) {
      return;
    }

    // 先にファイルを読み、読めた時だけ上書きしてよいかを尋ねる
    try {
      const text = await file.text();
      pending = scope ? parseScopedBackup(text, values, scope) : parseBackup(text, values);
      message = null;
      confirming = true;
    } catch (error) {
      fail(error);
    }
  }

  async function restore() {
    if (!pending) {
      return;
    }

    const restored = pending;
    pending = null;
    try {
      await onRestore(restored);
      message = { text: `${noun}を読み込みました`, failed: false };
    } catch (error) {
      fail(error, `${noun}を保存できませんでした`);
    }
  }

  function fail(error: unknown, text = "このファイルは読み込めません") {
    console.error("[mi-mo] settings", error);
    message = { text, failed: true };
  }
</script>

<div class="flex flex-wrap gap-2">
  <Button type="button" variant="outline" size="sm" class="gap-1.5" onclick={handleExport}>
    <Download class="size-4" />
    ファイルへ書き出す
  </Button>
  <Button
    type="button"
    variant="outline"
    size="sm"
    class="gap-1.5"
    onclick={() => fileInput.click()}
  >
    <Upload class="size-4" />
    ファイルから読み込む
  </Button>
  <input
    bind:this={fileInput}
    type="file"
    accept="application/json,.json"
    class="hidden"
    onchange={handleFile}
  />
</div>
<ConfirmDialog
  bind:open={confirming}
  title="現在の設定が上書きされます。よろしいですか？"
  confirmLabel="読み込む"
  onConfirm={restore}
/>
{#if message}
  <p
    class={["mt-2 text-note", message.failed ? "text-destructive" : "text-muted-foreground"]}
    role="status"
  >
    {message.text}
  </p>
{/if}
