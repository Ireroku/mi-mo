<script lang="ts">
  import type { ClockConfig, PeriodSlot } from "./clock.logic";
  import {
    formatDate,
    formatTime,
    formatWeekday,
    findCurrentPeriod,
    startClockTicker,
  } from "./clock.logic";
  import { Badge } from "$lib/components/ui/badge";

  interface Props {
    config: ClockConfig;
    periodTable: PeriodSlot[];
  }

  let { config, periodTable }: Props = $props();

  let now = $state(new Date());
  let showSeconds = $derived(config.showSeconds ?? false);

  $effect(() => {
    return startClockTicker((tick) => {
      now = tick;
    }, showSeconds ? "second" : "minute");
  });

  let currentPeriod = $derived(
    config.showPeriod ? findCurrentPeriod(now, periodTable) : undefined,
  );
</script>

<!-- 時刻を主役にし、日付と曜日は補助として落とす。時限はBadgeで独立させる -->
<div class="flex h-full items-center gap-2 whitespace-nowrap px-3 font-sans">
  <span class="text-sm font-medium tabular-nums text-foreground">
    {formatTime(now, showSeconds)}
  </span>
  {#if config.showDate}
    <span class="text-xs text-muted-foreground">{formatDate(now)}</span>
  {/if}
  {#if config.showWeekday}
    <span class="text-xs text-muted-foreground">{formatWeekday(now)}</span>
  {/if}
  {#if config.showPeriod}
    <Badge variant="secondary">
      {currentPeriod ? `${currentPeriod.period}限` : "時間外"}
    </Badge>
  {/if}
</div>
