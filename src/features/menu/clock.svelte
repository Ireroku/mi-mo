<script lang="ts">
  import type { Attachment } from "svelte/attachments";
  import type { ClockConfig, PeriodSlot } from "./clock.logic";
  import {
    formatDate,
    formatTime,
    findCurrentPeriod,
    formatPeriodName,
    periodName,
    startClockTicker,
  } from "./clock.logic";

  interface Props {
    config: ClockConfig;
    periodTable: PeriodSlot[];
    // menu は上部メニュー用で、狭い画面で部分を消す。drawer はドロワーのブロック用で、消さずにすべて出す
    layout?: "menu" | "drawer";
    // 狭い画面で消える部分を見張る。メニューに入りきらない時計をドロワーへ移す時だけ渡す
    watch?: (part: string) => Attachment;
  }

  let { config, periodTable, layout = "menu", watch }: Props = $props();

  let inMenu = $derived(layout === "menu");

  let now = $state(new Date());

  $effect(() => {
    return startClockTicker((tick) => {
      now = tick;
    }, config.showSeconds ? "second" : "minute");
  });

  let currentPeriod = $derived(
    config.showPeriod ? findCurrentPeriod(now, periodTable) : undefined,
  );
  let currentName = $derived(currentPeriod ? periodName(currentPeriod) : "");
  let dateText = $derived(formatDate(now, config));
</script>

<!-- 左に時限、右に時刻と日付の二段。メニューでは、狭い画面で時限、日付、時刻の順に消す -->
<div
  class={[
    "flex items-center whitespace-nowrap font-sans leading-tight",
    inMenu && "h-full px-3 max-[360px]:hidden",
  ]}
  {@attach watch?.("clock")}
>
  {#if currentName}
    <!-- 名前は1つのテキストのまま縦に書き、列の区切りは改行で示す。間隔は要素の余白で取り、時限が無い時に幅を残さない -->
    <span
      class={[
        "mr-1.5 whitespace-pre text-xs leading-none text-muted-foreground [text-orientation:upright] [writing-mode:vertical-rl]",
        inMenu && "max-md:hidden",
      ]}
      title={currentName}
      {@attach watch?.("period")}
    >{formatPeriodName(currentName)}</span>
  {/if}
  <div class="flex flex-col">
    <span class="text-sm font-medium tabular-nums text-foreground">
      {formatTime(now, config)}
    </span>
    {#if dateText}
      <span
        class={["text-xs tabular-nums text-muted-foreground", inMenu && "max-sm:hidden"]}
        {@attach watch?.("date")}
      >{dateText}</span>
    {/if}
  </div>
</div>
