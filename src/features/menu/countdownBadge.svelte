<script lang="ts">
  import type { Attachment } from "svelte/attachments";
  import type { CountdownTarget, CountdownThresholds } from "./countdownBadge.logic";
  import {
    CLASSES_OVER_LABEL,
    formatRemaining,
    wrapLabel,
  } from "./countdownBadge.logic";
  import { startClockTicker } from "./clock.logic";

  interface Props {
    targets: CountdownTarget[];
    thresholds: CountdownThresholds;
    // menu は上部メニュー用で、入りきらない件を切って隠す。drawer はドロワーのブロック用で、渡された件をすべて出す
    layout?: "menu" | "drawer";
    // 各件が切れて隠れたかを見張る。鍵は対象の id。メニューに入りきらない件をドロワーへ移す時だけ渡す
    watch?: (id: string) => Attachment;
  }

  let { targets, thresholds, layout = "menu", watch }: Props = $props();

  let inMenu = $derived(layout === "menu");

  let now = $state(new Date());

  $effect(() => {
    return startClockTicker((tick) => {
      now = tick;
    }, "second");
  });
</script>

<!-- 1件ごとに、上段にラベル、下段に残り時間を左揃えで積む。ラベルの無い残り時間は出さない。
     メニューでは、置き場所の幅に入りきらない件は2行目へ折り返し、高さで切って隠す。後ろの件から先に消える。
     先頭の幅0の要素は、1件目も入りきらない時に1件目を折り返させ、切れた姿で残さないためのもの。
     ドロワーでは高さで切らず、幅に入りきらない件は次の行へ回して出す -->
{#if targets.length > 0}
  <div
    class={[
      "flex flex-wrap font-sans leading-tight",
      inMenu ? "h-12 justify-end overflow-hidden pr-3" : "items-end gap-x-3 gap-y-2",
    ]}
  >
    {#if inMenu}
      <span class="h-12 w-0" aria-hidden="true"></span>
    {/if}
    {#each targets as target (target.id)}
      {@const state = target.resolve(now)}
      {#if state.kind === "classesOver"}
        <span
          class={[
            "flex items-center whitespace-nowrap text-xs text-muted-foreground",
            inMenu && "h-12 pl-3",
          ]}
          {@attach watch?.(target.id)}
        >
          {CLASSES_OVER_LABEL}
        </span>
      {:else}
        <!-- ラベルの行数が違っても、残り時間が同じ高さに並ぶよう下で揃える -->
        <!-- 中身が高さを越えても上へはみ出さないよう切る。はみ出すと、折り返した件の上端が1行目に見えてしまう -->
        <span
          class={["flex flex-col justify-end", inMenu && "h-12 overflow-hidden pl-3"]}
          title={state.label}
          {@attach watch?.(target.id)}
        >
          {#if state.label}
            <!-- 時計の時限と同じ文字の形にする。text-xs は行の高さも決めるので、leading-none で詰めて2行を収める。行の分け方は wrapLabel が決める -->
            <span class="flex flex-col whitespace-nowrap text-xs leading-none text-muted-foreground">
              {#each wrapLabel(state.label) as line, j (j)}
                <span>{line}</span>
              {/each}
            </span>
          {/if}
          <span class="whitespace-nowrap text-sm font-medium tabular-nums text-foreground">
            {formatRemaining(state.target.getTime() - now.getTime(), thresholds)}
          </span>
        </span>
      {/if}
    {/each}
  </div>
{/if}
