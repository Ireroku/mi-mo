<script lang="ts">
  import { Download, Upload } from "@lucide/svelte";
  import { saveBlob } from "@/utils/download";
  import { openFilePicker, pickTarget } from "./filePicker";
  import ConfirmDialog from "./controls/ConfirmDialog.svelte";
  import ActionRow from "./controls/ActionRow.svelte";
  import StatusText from "./controls/StatusText.svelte";
  import type { BackupScope } from "./backup.logic";
  import type { SettingsValues } from "./types";
  import {
    BACKUP_FILENAME,
    buildBackup,
    narrowValues,
    parseBackup,
    parseScopedBackup,
  } from "./backup.logic";

  interface Props {
    values: SettingsValues;
    onRestore: (values: SettingsValues) => Promise<void>;
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
  let pending = $state<SettingsValues | null>(null);
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

<!-- 行はカードの区切り線で分けるため、外側の要素で包まない。隠れた要素は区切り線が付かない先頭に置く -->
<input
  bind:this={fileInput}
  type="file"
  accept="application/json,.json"
  class="hidden"
  onchange={handleFile}
/>
<ConfirmDialog
  bind:open={confirming}
  title="現在の設定が上書きされます。よろしいですか？"
  confirmLabel="読み込む"
  destructive
  onConfirm={restore}
/>
<ActionRow label="ファイルへ書き出す" icon={Download} onclick={handleExport} />
<ActionRow
  label="ファイルから読み込む"
  icon={Upload}
  onclick={() => openFilePicker(fileInput)}
  {@attach pickTarget((text) => (message = { text, failed: false }))}
/>
{#if message}
  <StatusText class="py-2.5 pr-4" text={message.text} failed={message.failed} />
{/if}
