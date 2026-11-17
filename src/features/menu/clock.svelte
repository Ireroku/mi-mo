<script lang="ts">
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
  }

  let { config, periodTable }: Props = $props();

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

<!-- 左に時限、右に時刻と日付の二段。狭い画面では時限、日付、時刻の順に消す -->
<div class="flex h-full items-center whitespace-nowrap px-3 font-sans leading-tight max-[360px]:hidden">
  {#if currentName}
    <!-- 名前は1つのテキストのまま縦に書き、列の区切りは改行で示す。間隔は要素の余白で取り、時限が無い時に幅を残さない -->
    <span
      class="mr-1.5 whitespace-pre text-xs leading-none text-muted-foreground [text-orientation:upright] [writing-mode:vertical-rl] max-md:hidden"
      title={currentName}
    >{formatPeriodName(currentName)}</span>
  {/if}
  <div class="flex flex-col">
    <span class="text-sm font-medium tabular-nums text-foreground">
      {formatTime(now, config)}
    </span>
    {#if dateText}
      <span class="text-xs tabular-nums text-muted-foreground max-sm:hidden">{dateText}</span>
    {/if}
  </div>
</div>
