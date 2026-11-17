<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Download, Upload } from "@lucide/svelte";
  import { saveBlob } from "@/utils/download";
  import { BACKUP_FILENAME, buildBackup, parseBackup } from "./backup.logic";

  type Values = Record<string, Record<string, unknown>>;

  interface Props {
    values: Values;
    onRestore: (values: Values) => Promise<void>;
  }

  let { values, onRestore }: Props = $props();

  let fileInput: HTMLInputElement;
  let message = $state<{ text: string; failed: boolean } | null>(null);

  function handleExport() {
    const json = JSON.stringify(buildBackup(values), null, 2);
    saveBlob(new Blob([json], { type: "application/json" }), BACKUP_FILENAME);
  }

  async function handleFile() {
    const file = fileInput.files?.[0];
    // 同じファイルをもう一度選んでも change が起きるよう、選択を空へ戻す
    fileInput.value = "";
    if (!file) {
      return;
    }

    try {
      await onRestore(parseBackup(await file.text(), values));
      message = { text: "設定を読み込みました", failed: false };
    } catch (error) {
      console.error("[mi-mo] settings", error);
      message = { text: "このファイルは読み込めません", failed: true };
    }
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
{#if message}
  <p
    class={["mt-2 text-note", message.failed ? "text-destructive" : "text-muted-foreground"]}
    role="status"
  >
    {message.text}
  </p>
{/if}
