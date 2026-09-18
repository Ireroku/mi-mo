<script lang="ts">
  import type { ClockConfig, PeriodSlot } from "./clock.logic";
  import {
    formatDate,
    formatTime,
    formatWeekday,
    findCurrentPeriod,
    startClockTicker,
  } from "./clock.logic";

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

<div class="mimo-clock">
  <span class="mimo-clock__time">{formatTime(now, showSeconds)}</span>
  {#if config.showDate}
    <span class="mimo-clock__date">{formatDate(now)}</span>
  {/if}
  {#if config.showWeekday}
    <span class="mimo-clock__weekday">{formatWeekday(now)}</span>
  {/if}
  {#if config.showPeriod}
    <span class="mimo-clock__period">{currentPeriod ? `${currentPeriod.period}限` : "時間外"}</span>
  {/if}
</div>

<style>
  /* Shadow DOM内にマウントされるためMoodle側CSSと衝突せず、Tailwindユーティリティも届かないので生CSSで記述する */
  .mimo-clock {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: 100%;
    padding: 0 0.75rem;
    font-size: 0.8125rem;
    color: #4a4a4a;
    white-space: nowrap;
  }
</style>
