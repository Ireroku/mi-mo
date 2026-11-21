<script lang="ts">
  // リセットの行を1枚のカードに並べる。操作の行は確認を挟んでから実行し、結果をカードの下端に出す
  import ActionRow from "./controls/ActionRow.svelte";
  import OpenRow from "./controls/OpenRow.svelte";
  import ConfirmDialog from "./controls/ConfirmDialog.svelte";
  import SectionCard from "./controls/SectionCard.svelte";
  import StatusText from "./controls/StatusText.svelte";
  import type { ResetAction, ResetEntry, ResetMenu } from "./reset";

  interface Props {
    title?: string; // カードの見出し。省くと見出しを出さない
    entries: readonly ResetEntry[];
    onOpen?: (menu: ResetMenu) => void;
    onReset: (action: ResetAction) => Promise<void>;
  }

  let { title, entries, onOpen, onReset }: Props = $props();

  // 確認で尋ねている操作。閉じる動きの間も文言を残すため、次に尋ねるまで持ち続ける
  let asking = $state<ResetAction | null>(null);
  let confirming = $state(false);
  let message = $state<{ text: string; failed: boolean } | null>(null);

  function ask(action: ResetAction) {
    asking = action;
    message = null;
    confirming = true;
  }

  async function run() {
    const action = asking;
    if (!action) {
      return;
    }

    try {
      await onReset(action);
      message = { text: `${action.label}しました`, failed: false };
    } catch (error) {
      console.error("[mi-mo] settings", error);
      message = { text: `${action.label}できませんでした`, failed: true };
    }
  }
</script>

<SectionCard {title}>
  {#each entries as entry (entry.label)}
    {#if "actions" in entry}
      <OpenRow class="min-h-12 w-full" label={entry.label} onclick={() => onOpen?.(entry)} />
    {:else}
      <ActionRow label={entry.label} danger={entry.broad} onclick={() => ask(entry)} />
    {/if}
  {/each}
  {#if message}
    <StatusText class="py-2.5 pr-4" text={message.text} failed={message.failed} />
  {/if}
</SectionCard>
<ConfirmDialog
  bind:open={confirming}
  title={`${asking?.label ?? ""}します。元に戻せません。よろしいですか？`}
  confirmLabel="リセット"
  destructive
  onConfirm={run}
/>
