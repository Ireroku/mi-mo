<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import ListField from "./ListField.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Download, Upload } from "@lucide/svelte";
  import { saveBlob } from "@/utils/download";
  import { openFilePicker } from "../filePicker";
  import {
    MESSAGES_FILENAME,
    formatMessages,
    parseMessages,
  } from "@/features/home/greeting.logic";

  let { value, onChange }: CustomFieldProps<string[]> = $props();

  let items = $derived(value ?? []);

  let fileInput: HTMLInputElement;
  let notice = $state<{ text: string; failed: boolean } | null>(null);

  function handleExport() {
    saveBlob(
      new Blob([formatMessages(items)], { type: "text/plain" }),
      MESSAGES_FILENAME,
    );
  }

  async function handleFile() {
    const file = fileInput.files?.[0];
    // 同じファイルをもう一度選んでも change が起きるよう、選択を空へ戻す
    fileInput.value = "";
    if (!file) {
      return;
    }

    const messages = parseMessages(await file.text());
    if (messages.length === 0) {
      notice = { text: "このファイルにはメッセージがありません", failed: true };
      return;
    }

    onChange(messages);
    notice = { text: `${messages.length}件を読み込みました`, failed: false };
  }
</script>

<!-- 件数が多い時にも届くよう、ファイルの操作は一覧より上へ置く -->
<div class="mb-2 flex flex-wrap items-center gap-2">
  <Button type="button" variant="outline" size="sm" class="gap-1.5" onclick={handleExport}>
    <Download class="size-4" />
    ファイルへ書き出す
  </Button>
  <Button
    type="button"
    variant="outline"
    size="sm"
    class="gap-1.5"
    onclick={() => openFilePicker(fileInput)}
  >
    <Upload class="size-4" />
    ファイルから読み込む
  </Button>
  <span class="text-note text-muted-foreground">{items.length}件</span>
  <input
    bind:this={fileInput}
    type="file"
    accept="text/plain,.txt"
    class="hidden"
    onchange={handleFile}
  />
</div>
<p
  class={["mb-2 text-note", notice?.failed ? "text-destructive" : "text-muted-foreground"]}
  role="status"
>
  {notice?.text ?? "ファイルは1行に1件です。読み込むと、今の一覧と入れ替わります"}
</p>

<ListField
  {items}
  {onChange}
  createItem={() => ""}
  addLabel="挨拶メッセージを追加"
>
  {#snippet row(item, update)}
    <Input
      type="text"
      placeholder="メッセージ内容"
      value={item}
      oninput={(e) => update((e.target as HTMLInputElement).value)}
    />
  {/snippet}
</ListField>
