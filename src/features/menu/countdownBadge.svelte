<script lang="ts">
  import type { CountdownTarget } from "./countdownBadge.logic";
  import { describeCountdown } from "./countdownBadge.logic";
  import { startClockTicker } from "./clock.logic";

  interface Props {
    targets: CountdownTarget[];
  }

  let { targets }: Props = $props();

  let now = $state(new Date());

  $effect(() => {
    return startClockTicker((tick) => {
      now = tick;
    }, "second");
  });
</script>

<div class="mimo-countdown">
  {#each targets as target (target.id)}
    <span class="mimo-countdown__item">
      <span class="mimo-countdown__label">{target.label}</span>
      <span class="mimo-countdown__value">{describeCountdown(target, now)}</span>
    </span>
  {/each}
</div>

<style>
  /* Shadow DOM内にマウントされるためMoodle側CSSと衝突せず、Tailwindユーティリティも届かないので生CSSで記述する */
  .mimo-countdown {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    height: 100%;
    padding: 0 0.75rem;
    font-size: 0.8125rem;
    color: #4a4a4a;
    white-space: nowrap;
  }

  .mimo-countdown__item {
    display: flex;
    gap: 0.25rem;
  }

  .mimo-countdown__label {
    opacity: 0.7;
  }
</style>
