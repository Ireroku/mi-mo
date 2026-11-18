<script lang="ts">
  import DrawerBlock from "@/features/ui/DrawerBlock.svelte";
  import ClockBadge from "./clock.svelte";
  import CountdownBadge from "./countdownBadge.svelte";
  import type { ClockConfig, PeriodSlot } from "./clock.logic";
  import type { CountdownTarget, CountdownThresholds } from "./countdownBadge.logic";
  import type { HiddenTracker } from "./visibility.svelte";

  interface Props {
    clock: ClockConfig;
    periodTable: PeriodSlot[];
    targets: CountdownTarget[];
    thresholds: CountdownThresholds;
    // メニューで隠れた時計の部分と、カウントダウンの対象。index.ts がメニューのバッジと共有する
    hiddenClock: HiddenTracker<string>;
    hiddenCountdowns: HiddenTracker<string>;
  }

  let { clock, periodTable, targets, thresholds, hiddenClock, hiddenCountdowns }: Props =
    $props();

  let clockHidden = $derived(hiddenClock.hiddenKeys.size > 0);
  let hiddenTargets = $derived.by(() => {
    const ids = hiddenCountdowns.hiddenKeys;
    return targets.filter((target) => ids.has(target.id));
  });
</script>

<!-- メニューで時計の一部でも隠れたら、時計をすべて出す。カウントダウンはメニューで隠れた件だけを出す。
     何も隠れていない間はブロックごと置かない -->
{#if clockHidden || hiddenTargets.length > 0}
  <DrawerBlock title="時計">
    <div class="flex flex-col gap-2">
      {#if clockHidden}
        <ClockBadge config={clock} {periodTable} layout="drawer" />
      {/if}
      <CountdownBadge targets={hiddenTargets} {thresholds} layout="drawer" />
    </div>
  </DrawerBlock>
{/if}
