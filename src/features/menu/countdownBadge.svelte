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

<!-- 上段にラベル、下段に残り時間。画面が狭い時は、ラベル、2件目以降の順に譲る -->
<div class="flex h-full items-center px-3 font-sans leading-tight">
  <!-- ラベルの行数が違っても、残り時間が同じ高さに並ぶよう下で揃える -->
  <div class="flex items-end gap-3">
    {#each targets as target, i (target.id)}
      <span
        class={["flex flex-col items-end", i > 0 && "max-lg:hidden"]}
        title={target.label}
      >
        {#if target.label}
          <span
            class="line-clamp-2 max-w-[8em] text-right text-xs wrap-anywhere text-muted-foreground max-xl:hidden"
          >
            {target.label}
          </span>
        {/if}
        <span class="whitespace-nowrap text-sm font-medium tabular-nums text-foreground">
          {describeCountdown(target, now)}
        </span>
      </span>
    {/each}
  </div>
</div>
