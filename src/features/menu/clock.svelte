<script lang="ts">
  import type { ClockConfig, PeriodSlot } from "./clock.logic";
  import {
    formatDate,
    formatTime,
    findCurrentPeriod,
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
  let dateText = $derived(formatDate(now, config));
</script>

<!-- 上段に時刻と時限、下段に日付。幅は長い方の段だけで決まる -->
<div
  class="flex h-full flex-col items-end justify-center whitespace-nowrap px-3 font-sans leading-tight"
>
  <span class="flex items-baseline gap-1.5">
    <span class="text-sm font-medium tabular-nums text-foreground">
      {formatTime(now, config)}
    </span>
    {#if currentPeriod}
      <span class="text-xs text-muted-foreground">{currentPeriod.period}限</span>
    {/if}
  </span>
  {#if dateText}
    <span class="text-xs tabular-nums text-muted-foreground">{dateText}</span>
  {/if}
</div>
