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

<!-- 残り時間を主役にし、何のカウントダウンかを示すラベルは補助として落とす -->
<div class="flex h-full items-center gap-3 whitespace-nowrap px-3 font-sans">
  {#each targets as target (target.id)}
    <span class="flex items-center gap-1.5">
      <span class="text-xs text-muted-foreground">{target.label}</span>
      <span class="text-sm font-medium tabular-nums text-foreground">
        {describeCountdown(target, now)}
      </span>
    </span>
  {/each}
</div>
